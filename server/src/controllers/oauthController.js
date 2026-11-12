// CONTROLLER for OAuth (one-click "Connect" from Claude). Rules are in services/oauthService.js.
//
// Public (called by Claude):
//   GET  /.well-known/oauth-protected-resource[/mcp]  where to sign in for /mcp
//   GET  /.well-known/oauth-authorization-server     our OAuth endpoints
//   POST /oauth/register                             client registration
//   GET  /oauth/authorize                            check, then open the app's consent page
//   POST /oauth/token                                code -> access token
// App (signed-in user, session JWT):
//   GET  /api/oauth/authorize/info                   who asks (for the consent page)
//   POST /api/oauth/authorize                        user tapped "Allow" -> redirect URL with the code
import * as oauthService from '../services/oauthService.js';
import { ForbiddenError } from '../utils/errors.js';

// Public address of this API. On Render "trust proxy" makes req.protocol https.
export const baseUrl = (req) => `${req.protocol}://${req.get('host')}`;

// Address of the React app (consent page)
const appUrl = () => {
  const client = process.env.CLIENT_URL;
  return (process.env.APP_URL || (client && client !== '*' ? client.split(',')[0] : 'http://localhost:5173')).replace(/\/$/, '');
};

// Send OAuth errors in the OAuth format; other errors go to the central error handler
function oauthReply(fn) {
  return async (req, res, next) => {
    try {
      await fn(req, res);
    } catch (err) {
      if (err instanceof oauthService.OAuthError) {
        return res.status(err.status).json({ error: err.error, error_description: err.message });
      }
      next(err);
    }
  };
}

export const protectedResource = (req, res) => res.json(oauthService.protectedResourceMetadata(baseUrl(req)));

export const authorizationServer = (req, res) => res.json(oauthService.authorizationServerMetadata(baseUrl(req)));

export const register = oauthReply((req, res) => {
  res.status(201).json(oauthService.registerClient(req.body));
});

// Check the request first, so a bad request never reaches the consent page.
// The consent page gets the SAME query string and sends it back on "Allow".
export const authorize = oauthReply((req, res) => {
  oauthService.checkAuthorizeRequest(req.query);
  const query = new URLSearchParams(req.query).toString();
  res.redirect(`${appUrl()}/oauth/authorize?${query}`);
});

export const token = oauthReply(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(await oauthService.exchangeCode(req.body));
});

// Only the app itself (session JWT) may approve. An access token cannot approve new access.
function onlyFromApp(req) {
  if (req.authType !== 'session') throw new ForbiddenError('Sign in to the app to approve access');
}

export const consentInfo = oauthReply((req, res) => {
  onlyFromApp(req);
  res.json(oauthService.getConsentInfo(req.query));
});

export const approve = oauthReply((req, res) => {
  onlyFromApp(req);
  res.json(oauthService.approve(req.userId, req.body));
});
