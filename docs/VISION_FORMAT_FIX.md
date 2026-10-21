# Vision output validation and assessment selection

The grading endpoint previously requested JSON without supplying an output
schema. A photo of a square-pyramid answer uploaded against a Monokotil
assessment caused Gemini to return empty `answer` strings. Pydantic rejected
these and returned a generic format error (HTTP 502).

Workspace AI requests now send their Pydantic JSON Schema to Gemini (and to
Ollama's structured format field). Results are still validated locally before
storage. Malformed output is regenerated once from the original evidence;
there is no fabricated fallback or automatic score correction. Auth, quota,
and transport errors are not retried by this validation loop.

Vision additionally returns `assessmentMatch`:

- `MATCH`: evidence corresponds to the selected questions.
- `MISMATCH`: evidence clearly belongs to different questions/material;
  return HTTP 422 with selection guidance and save neither a grade nor asset.
- `UNCERTAIN`: insufficient evidence to establish correspondence, such as an
  answer-only image. Keep the teacher review gate and show a review notice.

Incorrect answers and blank answers alone do not establish a mismatch.
Missing/unreadable answers use explicit text markers instead of empty strings.
Question numbers refer to key-list positions, even if the original sheet uses
different printed numbering. Existing bounds on scores, rubric ownership,
source versions, and teacher approval remain enforced by the server.

The upload form requires an explicit assessment selection; it no longer
silently chooses the newest approved assessment. Changing filters clears that
selection. The model's correspondence classification is a review aid and can
still be wrong, so grades always require teacher verification.

Validation: regression tests for the original blank-answer response, bounded
retry, mismatch rejection without writes, uncertain evidence, and provider
failures. SDK transport tests check schema serialization for text, images, and
PDF. Real Vertex checks use the supplied pyramid image with both the matching
Matematika assessment and unrelated Monokotil assessment; content, report,
and PPT generation are also exercised with schemas.
