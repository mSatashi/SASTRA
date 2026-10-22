"""Reproducible custom-design proof using editorial content, not fake AI output.

Imports a fictional classroom sample into the isolated SQLite workspace, checks
the pre-approval gate, simulates teacher approval outside MCP, then calls the
actual stdio designer and PDF preview tools. No model inference is performed.
"""
import asyncio
import base64
import hashlib
import json
import os
from datetime import datetime

os.environ.setdefault("NO_GCE_CHECK", "true")

from mcp import Client
from backend.app.models.workspace import ExternalContentInput
from backend.mcp_sastra.client import server_parameters
from backend.mcp_sastra.designer import DesignPlan
from backend.mcp_sastra.office_demo import SOURCE
from backend.mcp_sastra.sandbox import ROOT, workspace


def sample_source():
    return ExternalContentInput(topic="Fotosintesis pada tumbuhan", subject="IPAS",
        objective="Menjelaskan bahan, energi, dan hasil fotosintesis melalui pengamatan serta diskusi.",
        materials=["Fotosintesis"], module=SOURCE,
        answerKey=[{"type":"essay","question":"Jelaskan peran cahaya dalam fotosintesis.",
            "correctAnswer":"Sumber energi untuk proses fotosintesis.",
            "rubric":"Nilai pemahaman tentang energi dan proses.","max":10}])


async def main():
    service = workspace()
    source = service.import_content(sample_source())["contents"][0]
    plan = DesignPlan.model_validate_json((ROOT/"examples/mcp/designed-lesson.json").read_text(encoding="utf-8"))
    output = ROOT.parent/"SASTRA-DESIGNER-QA-20261022"/datetime.now().strftime("run-%Y%m%d-%H%M%S")
    output.mkdir(parents=True)
    receipt = {"contentOrigin":"editorially authored sample using the earlier source lesson",
        "modelInferencePerformed":False,"modelDoubleUsed":False,"transport":"real stdio MCP subprocess",
        "productionAccessed":False,"sourceId":source["id"],"trace":[]}
    async with Client(server_parameters(), read_timeout_seconds=240) as client:
        receipt["tools"]=[t.name for t in (await client.list_tools()).tools]
        args={"assessment_id":source["id"],"expected_version":1,"plan":plan.model_dump()}
        blocked = await client.call_tool("design_presentation",args)
        assert blocked.is_error, "Approval gate failed"
        receipt["trace"].append({"tool":"design_presentation","result":"blocked before approval"})
        # Explicit demo harness simulating teacher review, never an MCP tool.
        service.approve_content(source["id"],1)
        receipt["approval"]="demo harness simulates a teacher; not a teacher's production approval"
        args["expected_version"]=2
        result=await client.call_tool("design_presentation",args)
        if result.is_error:
            raise RuntimeError(" ".join(t.text for t in result.content if t.type=="text"))
        meta=result.structured_content
        receipt["presentation"]=meta
        receipt["trace"].append({"tool":"design_presentation","result":"DRAFT","slides":meta["slideCount"]})
        ppt=await client.read_resource(meta["resourceUri"])
        ppt_data=base64.b64decode(ppt.contents[0].blob)
        ppt_file=output/"SASTRA-Desain-Kustom.pptx"
        ppt_file.write_bytes(ppt_data)
        preview=await client.call_tool("preview_presentation",{"presentation_id":meta["id"]})
        if preview.is_error:
            raise RuntimeError(" ".join(t.text for t in preview.content if t.type=="text"))
        pdf=await client.read_resource(preview.structured_content["resourceUri"])
        pdf_data=base64.b64decode(pdf.contents[0].blob)
        (output/"SASTRA-Desain-Kustom.pdf").write_bytes(pdf_data)
        receipt["trace"].append({"tool":"preview_presentation","result":"PDF"})
        receipt["pptxSha256"]=hashlib.sha256(ppt_data).hexdigest()
        receipt["pptxBytes"]=len(ppt_data)
        receipt["pdfBytes"]=len(pdf_data)
        receipt["verifiedAt"]=datetime.now().astimezone().isoformat()
        (output/"receipt.json").write_text(json.dumps(receipt,ensure_ascii=False,indent=2),encoding="utf-8")
        print(json.dumps({"output":str(output),"slides":meta["slideCount"],"engine":meta["engine"]},indent=2))


if __name__=="__main__":
    asyncio.run(main())
