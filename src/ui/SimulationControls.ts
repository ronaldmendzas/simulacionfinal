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

    const labelRow = document.createElement("div");
    labelRow.className = "control-label-row";

    const label = document.createElement("span");
    label.className = "control-label";
    label.textContent = config.label;

    const valueDisplay = document.createElement("span");
    valueDisplay.id = `${config.id}-value`;
    valueDisplay.className = "control-value";
    valueDisplay.textContent = String(config.value);

    labelRow.appendChild(label);
    labelRow.appendChild(valueDisplay);

    const input = document.createElement("input");
    input.type = "range";
    input.id = config.id;
    input.min = String(config.min);
    input.max = String(config.max);
    input.value = String(config.value);
    input.step = String(config.step ?? 1);
    input.className = "slider-input";

    input.addEventListener("input", () => {
      const val = Number(input.value);
      valueDisplay.textContent = String(val);
      config.onChange?.(val);
    });

    wrapper.appendChild(labelRow);
    wrapper.appendChild(input);
    this.container.appendChild(wrapper);
    this.controls.set(config.id, input);
  }

  createToggle(config: ToggleConfig): void {
    const wrapper = document.createElement("div");
    wrapper.className = "control-group toggle-group";

    const label = document.createElement("label");
    label.className = "toggle-switch";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = config.id;
    input.checked = config.checked;

    const track = document.createElement("span");
    track.className = "toggle-track";
    const thumb = document.createElement("span");
    thumb.className = "toggle-thumb";
    track.appendChild(thumb);

    input.addEventListener("change", () => {
      config.onChange?.(input.checked);
      track.classList.toggle("active", input.checked);
    });

    if (config.checked) track.classList.add("active");

    const text = document.createElement("span");
    text.className = "toggle-text";
    text.textContent = config.label;

    label.appendChild(input);
    label.appendChild(track);
    label.appendChild(text);
    wrapper.appendChild(label);
    this.container.appendChild(wrapper);
    this.controls.set(config.id, input);
  }

  createButton(label: string, onClick: () => void, className: string = ""): void {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.className = `btn ${className}`.trim();
    btn.addEventListener("click", onClick);
    this.container.appendChild(btn);
  }

  createSeparator(): void {
    const sep = document.createElement("div");
    sep.className = "control-separator";
    this.container.appendChild(sep);
  }

  createSectionTitle(title: string): void {
    const h = document.createElement("h3");
    h.className = "control-section-title";
    h.textContent = title;
    this.container.appendChild(h);
  }

  createStats(initialStats: Record<string, string | number>): HTMLElement {
    const stats = document.createElement("div");
    stats.className = "stats-grid";

    for (const [key, value] of Object.entries(initialStats)) {
      const stat = document.createElement("div");
      stat.className = "stat-card";

      const val = document.createElement("div");
      val.className = "stat-number";
      val.id = `stat-${key.replace(/\s+/g, "-").toLowerCase()}`;
      val.textContent = String(value);

      const label = document.createElement("div");
      label.className = "stat-label";
      label.textContent = key;

      stat.appendChild(val);
      stat.appendChild(label);
      stats.appendChild(stat);
    }

    this.container.appendChild(stats);
    return stats;
  }

  updateStat(key: string, value: string | number): void {
    const el = document.getElementById(`stat-${key.replace(/\s+/g, "-").toLowerCase()}`);
    if (el) {
      el.textContent = String(value);
      el.classList.add("stat-updated");
      setTimeout(() => el.classList.remove("stat-updated"), 300);
    }
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