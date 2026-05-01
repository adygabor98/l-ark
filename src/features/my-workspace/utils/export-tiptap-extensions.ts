import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { FontSize } from "../../templates/export-layout/tiptap/extensions/font-size.extension";
import { CustomBold } from "../../templates/export-layout/tiptap/extensions/bold.extension";
import type { AvailableToken } from "../../templates/export-layout/export-layout.models";

/** Map from fieldId (string) → value */
export type FieldValueMap = Map<string, unknown>;

/** Creates a TipTap extension that replaces field tokens with real form values */
export function buildDataFilledFieldTokenExtension(fieldValues: FieldValueMap, tokens: AvailableToken[]) {
	return Node.create({
		name: "fieldToken",
		group: "inline",
		inline: true,
		atom: true,
		selectable: false,
		draggable: false,

		addAttributes() {
			return {
				fieldId: { default: null },
				fieldLabel: { default: null },
				fieldType: { default: null },
				fallbackText: { default: "—" },
				dateFormat: { default: null },
				numberFormat: { default: null },
				options: { default: null },
			};
		},

		parseHTML() {
			return [{ tag: "span[data-field-token]" }];
		},

		renderHTML({ node }) {
			const { fieldId, fieldType, fallbackText } = node.attrs;
			const rawValue = fieldValues.get(fieldId);

			// No value → show fallback, except for box-type fields that must always render their options
			const isBoxType = ["CHECKBOX", "RADIO_GROUP", "BOOLEAN"].includes(fieldType);
			if (!isBoxType && (rawValue === undefined || rawValue === null || rawValue === "")) {
				return [
					"span",
					{
						"data-field-filled": "",
						style: "color: #999; font-style: italic;",
					},
					fallbackText ?? "—",
				];
			}

			const valueStyle = "font-family: inherit; font-size: inherit; color: inherit;";

			// ── TEXT / EMAIL / PHONE / TEXTAREA / DESCRIPTION ──
			if (["TEXT", "TEXTAREA", "DESCRIPTION", "EMAIL", "PHONE"].includes(fieldType)) {
				return ["span", { "data-field-filled": "", style: valueStyle }, String(rawValue)];
			}

			// ── NUMBER ──
			if (fieldType === "NUMBER") {
				const token = tokens.find(t => t.fieldId === fieldId);
				const suffix = token?.suffix;
				const val = String(rawValue);
				return ["span", { "data-field-filled": "", style: valueStyle }, suffix ? `${val} ${suffix}` : val];
			}

			// ── CURRENCY ──
			if (fieldType === "CURRENCY") {
				const num = typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue));
				const formatted = isNaN(num) ? String(rawValue) : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
				return ["span", { "data-field-filled": "", style: valueStyle }, `${formatted} €`];
			}

			// ── PERCENTAGE ──
			if (fieldType === "PERCENTAGE") {
				return ["span", { "data-field-filled": "", style: valueStyle }, `${rawValue}%`];
			}

			// ── DATE ──
			if (fieldType === "DATE") {
				const d = new Date(String(rawValue));
				const formatted = isNaN(d.getTime()) ? String(rawValue) : d.toLocaleDateString();
				return ["span", { "data-field-filled": "", style: valueStyle }, formatted];
			}

			// ── DATE_TIME ──
			if (fieldType === "DATE_TIME") {
				const d = new Date(String(rawValue));
				const formatted = isNaN(d.getTime()) ? String(rawValue) : d.toLocaleString();
				return ["span", { "data-field-filled": "", style: valueStyle }, formatted];
			}

			// ── BOOLEAN ──
			if (fieldType === "BOOLEAN") {
				const boolVal = rawValue === true || rawValue === "true" || rawValue === "Yes";
				const boxStyle = "border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;border-radius:2px;flex-shrink:0;font-size:10px;font-weight:700;line-height:1;";
				return [
					"span",
					{ "data-field-filled": "BOOLEAN" },
					["span", { style: boxStyle }, boolVal ? "✓" : ""],
				];
			}

			// ── CHECKBOX ──
			if (fieldType === "CHECKBOX") {
				const options = JSON.parse(node.attrs.options || "[]");
				const selected = Array.isArray(rawValue) ? rawValue : [rawValue];
				return [
					"span",
					{ "data-field-filled": "CHECKBOX", style: "display: inline-flex; gap: 20px; flex-wrap: wrap;" },
					...options.map((opt: any) => {
						const isChecked = selected.includes(opt.value) || selected.includes(opt.label);
						const boxStyle = isChecked
							? "border:1.5px solid #059669;display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;border-radius:2px;flex-shrink:0;background:#059669;color:#fff;font-size:10px;line-height:1;font-weight:700;vertical-align:middle;"
							: "border:1.5px solid #555;display:inline-flex;align-items:center;justify-content:center;width:13px;height:13px;border-radius:2px;flex-shrink:0;vertical-align:middle;";
						return [
							"span",
							{ style: "display: inline-flex; align-items: center; gap: 6px;" },
							["span", { style: boxStyle }, isChecked ? "✓" : ""],
							["span", { style: "font-family: Lato-Bold" }, opt.label],
						];
					}),
				];
			}

			// ── RADIO_GROUP ──
			if (fieldType === "RADIO_GROUP") {
				const options = JSON.parse(node.attrs.options || "[]");
				// rawValue may be a boolean (Yes/No form) — map true → default/first option
				const resolvedValue = rawValue === true
					? (options.find((o: any) => o.isDefault) ?? options[0])?.value
					: rawValue === false
						? null
						: rawValue;
				return [
					"span",
					{ "data-field-filled": "RADIO_GROUP", style: "display: inline-flex; gap: 20px;" },
					...options.map((opt: any) => {
						const isSelected = resolvedValue != null && (resolvedValue === opt.value || resolvedValue === opt.label);
						const circleStyle = isSelected
							? "border:1.5px solid #000;display:inline-block;width:13px;height:13px;border-radius:50%;flex-shrink:0;background:#000;"
							: "border:1.5px solid #555;display:inline-block;width:13px;height:13px;border-radius:50%;flex-shrink:0;";
						return [
							"span",
							{ style: "display: inline-flex; align-items: center; gap: 6px;" },
							["span", { style: circleStyle }],
							["span", { style: "font-family: Lato-Bold" }, opt.label],
						];
					}),
				];
			}

			// ── SELECT ──
			if (fieldType === "SELECT") {
				const options = JSON.parse(node.attrs.options || "[]");
				const selected = options.find((o: any) => o.value === rawValue || o.label === rawValue);
				return ["span", { "data-field-filled": "", style: valueStyle }, selected?.label ?? String(rawValue)];
			}

			// ── ADDRESS ──
			if (fieldType === "ADDRESS") {
				const addr = typeof rawValue === "object" && rawValue !== null ? rawValue : {};
				const parts = [(addr as any).street, (addr as any).city, (addr as any).state, (addr as any).zip, (addr as any).country].filter(Boolean);
				return ["span", { "data-field-filled": "", style: valueStyle }, parts.length > 0 ? parts.join(", ") : String(rawValue)];
			}

			// ── FILE ──
			if (fieldType === "FILE") {
				return [
					"span",
					{ "data-field-filled": "FILE", style: "display:inline-flex;align-items:center;gap:4px;" },
					["span", { style: "font-size:12px;flex-shrink:0;" }, "📎"],
					["span", { style: valueStyle }, String(rawValue)],
				];
			}

			// ── Default fallback ──
			return ["span", { "data-field-filled": "", style: valueStyle }, String(rawValue)];
		},
	});
}

/** Build TipTap extensions for main content preview */
export function buildPreviewExtensions(fieldValues: FieldValueMap, tokens: AvailableToken[]) {
	return [
		StarterKit,
		TextAlign.configure({ types: ["heading", "paragraph"] }),
		Color,
		TextStyle,
		Highlight.configure({ multicolor: true }),
		Underline,
		Subscript,
		Superscript,
		FontSize,
		CustomBold,
		buildDataFilledFieldTokenExtension(fieldValues, tokens),
	];
}

/** Build TipTap extensions for header/footer zones */
export function buildZoneExtensions(fieldValues: FieldValueMap, tokens: AvailableToken[]) {
	return [
		StarterKit.configure({ heading: false }),
		TextAlign.configure({ types: ["paragraph"] }),
		Color,
		TextStyle,
		Highlight.configure({ multicolor: true }),
		Underline,
		FontSize,
		CustomBold,
		buildDataFilledFieldTokenExtension(fieldValues, tokens),
	];
}
