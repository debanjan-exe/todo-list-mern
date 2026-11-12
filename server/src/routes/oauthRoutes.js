// ROUTES for OAuth. Two routers:
//   publicOAuthRoutes  -> mounted at "/" (/.well-known/... and /oauth/...), called by Claude
//   appOAuthRoutes     -> mounted at "/api/oauth" behind requireAuth, called by the consent page
import { Router } from 'express';
import express from 'express';
import cors from 'cors';
import * as oauth from '../controllers/oauthController.js';

export const publicOAuthRoutes = Router();
publicOAuthRoutes.use(['/.well-known', '/oauth'], cors()); // any origin: these are public by design
publicOAuthRoutes.get(['/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp'], oauth.protectedResource);
publicOAuthRoutes.get('/.well-known/oauth-authorization-server', oauth.authorizationServer);
publicOAuthRoutes.post('/oauth/register', express.json(), oauth.register);
publicOAuthRoutes.get('/oauth/authorize', oauth.authorize);
// The token request is a form post (application/x-www-form-urlencoded); JSON also works
publicOAuthRoutes.post('/oauth/token', express.urlencoded({ extended: false }), express.json(), oauth.token);

export const appOAuthRoutes = Router();
appOAuthRoutes.get('/authorize/info', oauth.consentInfo);
appOAuthRoutes.post('/authorize', oauth.approve);
