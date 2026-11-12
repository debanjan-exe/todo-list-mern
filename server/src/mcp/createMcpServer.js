// Builds one MCP server for ONE signed-in user.
// A new server is made for every request ("stateless" mode), so no user data
// is kept in memory between requests, and it works on any number of instances.
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerTaskTools } from './tools.js';

const INSTRUCTIONS = `This server manages the user's To-Do List tasks.
- Every tool works only on the signed-in user's own tasks.
- Weeks start on Monday and end on Sunday.
- Send dates as ISO 8601 WITH the user's time zone offset (for example 2026-11-12T09:00:00+05:30).
- Get task ids from list_tasks or search_tasks before you update, complete or delete a task.
- Ask the user before you delete a task.`;

export function createMcpServer(userId) {
  const server = new McpServer(
    { name: 'todo-list', title: 'To-Do List', version: '1.0.0' },
    { instructions: INSTRUCTIONS }
  );
  registerTaskTools(server, userId);
  return server;
}
