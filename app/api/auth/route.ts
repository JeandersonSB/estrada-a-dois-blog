import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new NextResponse('GITHUB_CLIENT_ID is not configured', { status: 500 });
  }

  // Generate a random state for CSRF protection
  const state = Math.random().toString(36).substring(7);
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,user&state=${state}`;
  
  return NextResponse.redirect(githubAuthUrl);
}
