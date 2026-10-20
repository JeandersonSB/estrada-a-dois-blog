import { readFileSync, writeFileSync } from 'node:fs';

const monuments = JSON.parse(readFileSync(new URL('../app/rota-biker/monuments.json', import.meta.url), 'utf8'));
const ids = monuments.map(monument => monument.id);
if (new Set(ids).size !== ids.length || ids.some(id => !/^[a-f0-9]{16}$/.test(id))) {
  throw new Error('The monument catalog must have unique, valid IDs.');
}
const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function ownsDocument(uid) {
      return request.auth != null && request.auth.uid == uid;
    }

    // Generated from monuments.json. Regenerate when adding monument IDs.
    function monumentIds() {
      return [
${ids.map(id => `        '${id}'`).join(',\n')}
      ];
    }

    function validVisits() {
      let data = request.resource.data;
      return data.keys().hasOnly(['visits'])
        && data.keys().hasAll(['visits'])
        && data.visits is map
        && data.visits.size() <= ${ids.length}
        && data.visits.keys().hasOnly(monumentIds())
        && data.visits.values().hasOnly([true]);
    }

    match /bikerVisits/{uid} {
      allow get, delete: if ownsDocument(uid);
      allow list: if false;
      allow create, update: if ownsDocument(uid) && validVisits();
    }
  }
}
`;
writeFileSync(new URL('../firestore.rules', import.meta.url), rules);
