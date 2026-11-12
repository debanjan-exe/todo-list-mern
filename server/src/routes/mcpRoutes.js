// ROUTES for MCP. app.js adds requireAuth before these (Bearer personal access token).
import { Router } from 'express';
import { handleMcpPost, methodNotAllowed } from '../controllers/mcpController.js';

const router = Router();

router.post('/', handleMcpPost); //       POST /mcp  (JSON-RPC: initialize, tools/list, tools/call ...)
router.get('/', methodNotAllowed); //     GET  /mcp  -> 405
router.delete('/', methodNotAllowed); //  DELETE /mcp -> 405

export default router;
