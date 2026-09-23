import { DemoFormElement } from "./shared";

export class GuardedPanelElement extends HTMLElement {
  static register() {
    if (!customElements.get("guarded-panel")) customElements.define("guarded-panel", GuardedPanelElement);
  }

  connectedCallback() {
    const form = this.closest("demo-form");
    if (!(form instanceof DemoFormElement)) return;

    console.log("GUARDED_PANEL_JS_MARKER");
  }
}
