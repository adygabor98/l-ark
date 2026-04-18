import { Node } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { FontSize } from "../../../templates/export-layout/tiptap/extensions/font-size.extension";
import { CustomBold } from "../../../templates/export-layout/tiptap/extensions/bold.extension";
import type { AvailableToken } from "../../../templates/export-layout/export-layout.models";

/** Map from fieldId (string) → value */
export type FieldValueMap = Map<string, unknown>;

/** Creates a TipTap extension that replaces field tokens with real form values */
export function buildDataFilledFieldTokenExtension(
	fieldValues: FieldValueMap,
	tokens: AvailableToken[],
) {
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
			const rawValue = fieldValues.get(String(fieldId));

			// No value → show fallback
			if (rawValue === undefined || rawValue === null || rawValue === "") {
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
				return ["span", { "data-field-filled": "", style: valueStyle }, String(rawValue)];
			}

			// ── CURRENCY ──
			if (fieldType === "CURRENCY") {
				const num = typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue));
				const formatted = isNaN(num) ? String(rawValue) : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
				return ["span", { "data-field-filled": "", style: valueStyle }, formatted];
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
				const checkedStyle = "border:1.5px solid #555;display:inline-block;width:13px;height:13px;border-radius:2px;flex-shrink:0;background:#059669;";
				const uncheckedStyle = "border:1.5px solid #555;display:inline-block;width:13px;height:13px;border-radius:2px;flex-shrink:0;";
				return [
					"span",
					{ "data-field-filled": "BOOLEAN", style: "display:inline-flex;align-items:center;gap:12px;" },
					["span", { style: "display:inline-flex;align-items:center;gap:4px;" },
						["span", { style: boolVal ? checkedStyle : uncheckedStyle }],
						["span", {}, "Yes"],
					],
					["span", { style: "display:inline-flex;align-items:center;gap:4px;" },
						["span", { style: !boolVal ? checkedStyle : uncheckedStyle }],
						["span", {}, "No"],
					],
				];
			}

			// ── CHECKBOX ──
			if (fieldType === "CHECKBOX") {
				const options = JSON.parse(node.attrs.options || "[]");
				const selected = Array.isArray(rawValue) ? rawValue : [rawValue];
				return [
					"span",
					{ "data-field-filled": "CHECKBOX", style: "display: inline-flex; gap: 20px;" },
					...options.map((opt: any) => {
						const isChecked = selected.includes(opt.value) || selected.includes(opt.label);
						const boxStyle = isChecked
							? "border:1.5px solid #059669;display:inline-block;width:13px;height:13px;border-radius:2px;flex-shrink:0;background:#059669;"
							: "border:1.5px solid #555;display:inline-block;width:13px;height:13px;border-radius:2px;flex-shrink:0;";
						return [
							"span",
							{ style: "display: inline-flex; align-items: center; gap: 6px;" },
							["span", { style: boxStyle }],
							["span", { style: "font-family: Lato-Bold" }, opt.label],
						];
					}),
				];
			}

			// ── RADIO_GROUP ──
			if (fieldType === "RADIO_GROUP") {
				const options = JSON.parse(node.attrs.options || "[]");
				return [
					"span",
					{ "data-field-filled": "RADIO_GROUP", style: "display: inline-flex; gap: 20px;" },
					...options.map((opt: any) => {
						const isSelected = rawValue === opt.value || rawValue === opt.label;
						const circleStyle = isSelected
							? "border:1.5px solid #059669;display:inline-block;width:13px;height:13px;border-radius:50%;flex-shrink:0;background:#059669;"
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
