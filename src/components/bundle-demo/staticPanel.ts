import { DemoFormElement } from "./shared";

export class StaticPanelElement extends HTMLElement {
  static register() {
    if (!customElements.get("static-panel")) customElements.define("static-panel", StaticPanelElement);
  }

  connectedCallback() {
    const form = this.closest("demo-form");
    if (!(form instanceof DemoFormElement)) return;

    console.log("STATIC_PANEL_JS_MARKER");
  }
}
