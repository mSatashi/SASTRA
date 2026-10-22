"""Teacher-only local actions, deliberately not registered as MCP tools."""
import argparse
import json

from .sandbox import workspace


def main():
    p = argparse.ArgumentParser(description=__doc__)
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("queue", help="Read the sandbox workspace for human review")
    content = sub.add_parser("approve-assessment")
    content.add_argument("id")
    content.add_argument("--version", type=int, required=True)
    content.add_argument("--reviewed", action="store_true", required=True)
    grade = sub.add_parser("approve-grade")
    grade.add_argument("id")
    grade.add_argument("--version", type=int, required=True)
    grade.add_argument("--scores", type=float, nargs="+", required=True)
    grade.add_argument("--identity-confirmed", action="store_true", required=True)
    args = p.parse_args()
    service = workspace()
    if args.command == "approve-assessment":
        w = service.approve_content(args.id, args.version)
    elif args.command == "approve-grade":
        from backend.app.models.workspace import GradeInput
        w = service.approve_grade(args.id, GradeInput(expectedVersion=args.version,
            identityConfirmed=args.identity_confirmed, gradeItems=[{"score": s} for s in args.scores]))
    else:
        w = service.read()
    print(json.dumps(w, ensure_ascii=True, indent=2))


if __name__ == "__main__":
    main()
