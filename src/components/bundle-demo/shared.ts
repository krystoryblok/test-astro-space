export class DemoFormElement extends HTMLElement {
  static register() {
    if (!customElements.get("demo-form")) customElements.define("demo-form", DemoFormElement);
  }

  connectedCallback() {
    console.log("SHARED_FORM_JS_MARKER");
  }
}
