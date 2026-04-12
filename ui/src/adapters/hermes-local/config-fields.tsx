import type { AdapterConfigFieldsProps } from "../types";
import {
  Field,
  DraftInput,
} from "../../components/agent-config-primitives";
import { ChoosePathButton } from "../../components/PathInstructionsModal";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

export function HermesLocalConfigFields({
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
  hideInstructionsFile,
}: AdapterConfigFieldsProps) {
  return (
    <>
      {/* Command — required */}
      <Field label="Hermes CLI command" hint="Path to the hermes CLI executable">
        <DraftInput
          value={
            isCreate
              ? values!.command ?? ""
              : eff("adapterConfig", "command", String(config.command ?? ""))
          }
          onCommit={(v) =>
            isCreate
              ? set!({ command: v })
              : mark("adapterConfig", "command", v || undefined)
          }
          immediate
          className={inputClass}
          placeholder="/home/user/.local/bin/hermes"
        />
      </Field>

      {/* Instructions file */}
      {!hideInstructionsFile && (
        <Field label="Agent instructions file" hint="Absolute path to a markdown file (e.g. AGENTS.md)">
          <div className="flex items-center gap-2">
            <DraftInput
              value={
                isCreate
                  ? values!.instructionsFilePath ?? ""
                  : eff(
                      "adapterConfig",
                      "instructionsFilePath",
                      String(config.instructionsFilePath ?? ""),
                    )
              }
              onCommit={(v) =>
                isCreate
                  ? set!({ instructionsFilePath: v })
                  : mark("adapterConfig", "instructionsFilePath", v || undefined)
              }
              immediate
              className={inputClass}
              placeholder="/absolute/path/to/AGENTS.md"
            />
            <ChoosePathButton />
          </div>
        </Field>
      )}

      {/* Cabinet Memory Integration */}
      <Field label="Cabinet endpoint" hint="URL of the Cabinet memory API (default: http://localhost:3000)">
        <DraftInput
          value={
            isCreate
              ? values!.cabinetEndpoint ?? ""
              : eff("adapterConfig", "cabinetEndpoint", String(config.cabinetEndpoint ?? ""))
          }
          onCommit={(v) =>
            isCreate
              ? set!({ cabinetEndpoint: v })
              : mark("adapterConfig", "cabinetEndpoint", v || undefined)
          }
          immediate
          className={inputClass}
          placeholder="http://localhost:3000"
        />
      </Field>

      <Field label="Cabinet slug" hint="Memory namespace for this agent (e.g. 'hermes', 'hermes-prod')">
        <DraftInput
          value={
            isCreate
              ? values!.cabinetSlug ?? ""
              : eff("adapterConfig", "cabinetSlug", String(config.cabinetSlug ?? ""))
          }
          onCommit={(v) =>
            isCreate
              ? set!({ cabinetSlug: v })
              : mark("adapterConfig", "cabinetSlug", v || undefined)
          }
          immediate
          className={inputClass}
          placeholder="hermes"
        />
      </Field>

      <Field label="Memory sync mode" hint="How this agent syncs with Cabinet memory">
        <select
          value={
            isCreate
              ? values!.cabinetMemorySync ?? "push"
              : String(config.cabinetMemorySync ?? "push")
          }
          onChange={(e) => {
            const v = e.target.value;
            if (isCreate) set!({ cabinetMemorySync: v });
            else mark("adapterConfig", "cabinetMemorySync", v);
          }}
          className={inputClass}
        >
          <option value="push">Push — write to Cabinet after tasks</option>
          <option value="pull">Pull — read from Cabinet before tasks</option>
          <option value="bidirectional">Bidirectional — read and write</option>
          <option value="off">Off — no Cabinet sync</option>
        </select>
      </Field>
    </>
  );
}
