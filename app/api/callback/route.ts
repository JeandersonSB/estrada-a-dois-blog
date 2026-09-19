import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  
  if (!code) {
    return new NextResponse('No code provided', { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const data = await tokenResponse.json();
    const accessToken = data.access_token;

    if (!accessToken) {
      return new NextResponse('Failed to get access token', { status: 400 });
    }

    // Return the token to the CMS window using postMessage with strict origin validation
    const script = `
      <script>
        (function() {
          if (!window.opener) return;

          const allowedOrigins = [
            'https://www.estradaadois.com',
            'https://estradaadois.com',
            'https://estrada-a-dois-blog.vercel.app',
            'http://localhost:3000'
          ];

          function isAllowed(origin) {
            if (!origin) return false;
            return allowedOrigins.includes(origin) || origin.endsWith('.vercel.app');
          }

          let delivered = false;
          function deliver(targetOrigin) {
            if (delivered) return;
            delivered = true;
            try {
              window.opener.postMessage(
                'authorization:github:success:{"token":"${accessToken}","provider":"github"}',
                targetOrigin
              );
            } catch (err) {}
            setTimeout(function() {
              window.close();
            }, 150);
          }

          const receiveMessage = (event) => {
            if (!isAllowed(event.origin)) return;
            window.removeEventListener("message", receiveMessage, false);
            deliver(event.origin);
          };

          window.addEventListener("message", receiveMessage, false);

          // 1. Handshake padrão Sveltia / Decap CMS
          try {
            window.opener.postMessage("authorizing:github", "*");
          } catch (e) {}

          allowedOrigins.forEach(function(orig) {
            try {
              window.opener.postMessage("authorizing:github", orig);
            } catch (e) {}
          });

          // 2. Fallback de envio direto caso o handshake não responda
          setTimeout(function() {
            if (!delivered) {
              allowedOrigins.forEach(function(orig) {
                try {
                  window.opener.postMessage(
                    'authorization:github:success:{"token":"${accessToken}","provider":"github"}',
                    orig
                  );
                } catch (e) {}
              });
              setTimeout(function() {
                window.close();
              }, 200);
            }
          }, 600);
        })();
      </script>
    `;

    return new NextResponse(script, {
      headers: { 'Content-Type': 'text/html' },
    });
    
  } catch (error) {
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
