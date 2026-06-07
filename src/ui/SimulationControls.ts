export interface SliderConfig {
  id: string;
  label: string;
  min: number;
  max: number;
  value: number;
  step?: number;
  onChange?: (value: number) => void;
}

export interface ToggleConfig {
  id: string;
  label: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
}

export class SimulationControls {
  private container: HTMLElement;
  private controls: Map<string, HTMLInputElement> = new Map();

  constructor(containerId: string) {
    this.container = document.getElementById(containerId)!;
  }

  createSlider(config: SliderConfig): void {
    const wrapper = document.createElement("div");
    wrapper.className = "control-group";

    const label = document.createElement("label");
    label.htmlFor = config.id;
    label.textContent = config.label;

    const valueDisplay = document.createElement("span");
    valueDisplay.id = `${config.id}-value`;
    valueDisplay.textContent = String(config.value);
    valueDisplay.className = "control-value";

    const input = document.createElement("input");
    input.type = "range";
    input.id = config.id;
    input.min = String(config.min);
    input.max = String(config.max);
    input.value = String(config.value);
    input.step = String(config.step ?? 1);

    input.addEventListener("input", () => {
      const val = Number(input.value);
      valueDisplay.textContent = String(val);
      config.onChange?.(val);
    });

    label.appendChild(valueDisplay);
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    this.container.appendChild(wrapper);
    this.controls.set(config.id, input);
  }

  createToggle(config: ToggleConfig): void {
    const wrapper = document.createElement("div");
    wrapper.className = "control-group toggle-group";

    const label = document.createElement("label");
    label.className = "toggle-label";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = config.id;
    input.checked = config.checked;

    const checkmark = document.createElement("span");
    checkmark.className = "checkmark";

    input.addEventListener("change", () => {
      config.onChange?.(input.checked);
    });

    label.appendChild(input);
    label.appendChild(checkmark);
    const text = document.createElement("span");
    text.textContent = config.label;
    label.appendChild(text);

    wrapper.appendChild(label);
    this.container.appendChild(wrapper);
    this.controls.set(config.id, input);
  }

  createButton(label: string, onClick: () => void, className: string = ""): void {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = `control-button ${className}`;
    btn.addEventListener("click", onClick);
    this.container.appendChild(btn);
  }

  createStats(initialStats: Record<string, string | number>): HTMLElement {
    const stats = document.createElement("div");
    stats.className = "stats-panel";

    for (const [key, value] of Object.entries(initialStats)) {
      const stat = document.createElement("div");
      stat.className = "stat-item";

      const label = document.createElement("span");
      label.className = "stat-label";
      label.textContent = key;

      const val = document.createElement("span");
      val.className = "stat-value";
      val.id = `stat-${key.replace(/\s+/g, "-").toLowerCase()}`;
      val.textContent = String(value);

      stat.appendChild(label);
      stat.appendChild(val);
      stats.appendChild(stat);
    }

    this.container.appendChild(stats);
    return stats;
  }

  updateStat(key: string, value: string | number): void {
    const el = document.getElementById(`stat-${key.replace(/\s+/g, "-").toLowerCase()}`);
    if (el) el.textContent = String(value);
  }

  getValue(id: string): number {
    const input = this.controls.get(id);
    return input ? Number(input.value) : 0;
  }

  getChecked(id: string): boolean {
    const input = this.controls.get(id);
    return input ? (input as HTMLInputElement).checked : false;
  }

  clear(): void {
    this.container.innerHTML = "";
    this.controls.clear();
  }
}