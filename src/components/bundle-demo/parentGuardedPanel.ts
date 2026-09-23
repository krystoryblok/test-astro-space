import { DemoFormElement } from "./shared";

export class ParentGuardedPanelElement extends HTMLElement {
  static register() {
    if (!customElements.get("parent-guarded-panel")) customElements.define("parent-guarded-panel", ParentGuardedPanelElement);
  }

  connectedCallback() {
    const form = this.closest("demo-form");
    if (!(form instanceof DemoFormElement)) return;

    console.log("PATTERN_D_PANEL_JS_MARKER");
  }
}
