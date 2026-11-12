// CONTROLLER for MCP (Model Context Protocol), transport: Streamable HTTP, stateless.
//   POST /mcp   one JSON-RPC message in, one JSON answer out
//   GET / DELETE /mcp -> 405 (no server-sent stream, no sessions in stateless mode)
// requireAuth runs first, so req.userId is the signed-in user (personal access token).
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpServer } from '../mcp/createMcpServer.js';

export async function handleMcpPost(req, res, next) {
  const server = createMcpServer(req.userId);
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless: a fresh server per request
    enableJsonResponse: true, // plain JSON answers (no event stream)
  });
  res.on('close', () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    next(err);
  }
}

export function methodNotAllowed(req, res) {
  res.status(405).json({
    jsonrpc: '2.0',
    error: { code: -32000, message: 'Method not allowed. Use POST /mcp.' },
    id: null,
  });
}
