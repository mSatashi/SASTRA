"""Local CLI host: discovery, direct MCP calls, PPT download, or Gemini agent."""
import argparse
import asyncio
import base64
import json
import os
import sys
from pathlib import Path

from mcp import Client, StdioServerParameters

from .sandbox import ROOT, database_path


def server_parameters():
    database_path()  # Fail before starting any subprocess in a deployed runtime.
    env = {"NO_GCE_CHECK": "true", "PYTHONIOENCODING": "utf-8"}
    # Pass only inference settings; web/database/cloud-bootstrap configuration is
    # never forwarded to the child process. The SDK also inherits basic OS vars.
    for name in ("LLM_PROVIDER", "GEMINI_AUTH_MODE", "GEMINI_MODEL", "GCP_PROJECT",
                 "GCP_LOCATION", "GOOGLE_APPLICATION_CREDENTIALS", "GEMINI_API_KEY",
                 "OLLAMA_BASE_URL", "OLLAMA_MODEL", "OLLAMA_VISION_MODEL"):
        if name in os.environ:
            env[name] = os.environ[name]
    return StdioServerParameters(command=sys.executable,
        args=["-m", "backend.mcp_sastra.server"], cwd=ROOT, env=env)


def parser():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("tools", help="Negotiate MCP and discover tools")
    call = sub.add_parser("call", help="Call a tool with a local JSON argument file")
    call.add_argument("name")
    call.add_argument("--args-file", type=Path, required=True)
    grade = sub.add_parser("grade", help="Upload a local answer file through MCP")
    grade.add_argument("--student", required=True)
    grade.add_argument("--assessment", required=True)
    grade.add_argument("--file", type=Path, required=True)
    download = sub.add_parser("download", help="Read a generated PPT through MCP resources")
    download.add_argument("presentation_id")
    download.add_argument("--out", type=Path, required=True)
    agent = sub.add_parser("agent", help="Use Gemini to choose and call discovered MCP tools")
    agent.add_argument("prompt")
    return p


async def execute(args):
    async with Client(server_parameters(), read_timeout_seconds=240) as client:
        if args.command == "tools":
            result = await client.list_tools()
            return {"server": client.server_info.name,
                    "tools": [t.name for t in result.tools]}
        if args.command == "agent":
            from .agent import GeminiToolModel, run_agent
            model = GeminiToolModel()
            try:
                return await run_agent(client, args.prompt, model)
            finally:
                model.close()
        if args.command == "download":
            if not args.presentation_id.isalnum() or len(args.presentation_id) > 100:
                raise ValueError("Invalid presentation ID")
            result = await client.read_resource(f"sastra://presentations/{args.presentation_id}")
            if len(result.contents) != 1 or not hasattr(result.contents[0], "blob"):
                raise RuntimeError("Server did not return a binary PPTX resource")
            data = base64.b64decode(result.contents[0].blob, validate=True)
            with args.out.open("xb") as out:
                out.write(data)
            return {"saved": str(args.out.resolve()), "bytes": len(data)}
        if args.command == "grade":
            mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".pdf": "application/pdf"}.get(args.file.suffix.lower())
            if mime is None or not 0 < args.file.stat().st_size <= 10 * 1024 * 1024:
                raise ValueError("Use PNG/JPG/PDF up to 10 MB")
            name = "grade_answer"
            arguments = {"student_id": args.student, "assessment_id": args.assessment,
                         "mime_type": mime, "answer_base64": base64.b64encode(args.file.read_bytes()).decode()}
        else:
            name = args.name
            arguments = json.loads(args.args_file.read_text(encoding="utf-8-sig"))
        result = await client.call_tool(name, arguments)
        if result.is_error:
            raise RuntimeError(" ".join(c.text for c in result.content if c.type == "text"))
        return result.structured_content


def main():
    args = parser().parse_args()
    try:
        print(json.dumps(asyncio.run(execute(args)), ensure_ascii=True, indent=2))
    except Exception as exc:
        def messages(error):
            if isinstance(error, BaseExceptionGroup):
                return [m for child in error.exceptions for m in messages(child)]
            return [f"{type(error).__name__}: {error}"]
        print("MCP request failed: " + "; ".join(messages(exc)), file=sys.stderr)
        raise SystemExit(1)


if __name__ == "__main__":
    main()
