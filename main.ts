import { MarkdownPostProcessorContext, Plugin, TFile } from 'obsidian';

interface ListItem {
	name: string;
	checked: boolean;
}

interface PluginData {
	library: string[];
	lists: Record<string, ListItem[]>;
}

const DEFAULT_DATA: PluginData = {
	library: [],
	lists: {},
};

function generateId(): string {
	return Math.random().toString(36).substring(2, 9);
}

const STYLE_ID = 'grocery-plugin-styles';

const CSS = `
.grocery-plugin {
	padding: 12px;
	border-radius: 6px;
	border: 1px solid var(--background-modifier-border);
	background: var(--background-secondary);
}

.grocery-input-row {
	display: flex;
	gap: 8px;
	margin-bottom: 12px;
}

.grocery-input-row input {
	flex: 1;
	padding: 6px 10px;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	background: var(--background-primary);
	color: var(--text-normal);
	font-size: 14px;
}

.grocery-input-row input:focus {
	outline: none;
	border-color: var(--interactive-accent);
}

.grocery-add-btn {
	padding: 6px 14px;
	border: none;
	border-radius: 4px;
	background: var(--interactive-accent) !important;
	color: #ffffff !important;
	cursor: pointer;
	font-size: 14px;
	white-space: nowrap;
	font-weight: 500;
}

.grocery-add-btn:hover {
	opacity: 0.85;
}

.grocery-item {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 5px 0;
}

.grocery-item.checked .grocery-item-name {
	opacity: 0.4;
	text-decoration: line-through;
}

.grocery-item input[type="checkbox"] {
	cursor: pointer;
	accent-color: var(--interactive-accent);
	flex-shrink: 0;
}

.grocery-item-name {
	flex: 1;
	color: var(--text-normal);
	font-size: 14px;
}

.grocery-qty {
	display: flex;
	align-items: center;
	gap: 4px;
	flex-shrink: 0;
}

.grocery-qty-btn {
	background: none;
	border: 1px solid var(--background-modifier-border);
	border-radius: 3px;
	cursor: pointer;
	font-size: 13px;
	font-weight: 600;
	width: 20px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	line-height: 1;
	transition: opacity 0.1s;
}

.grocery-qty-btn:hover {
	opacity: 0.75;
}

.grocery-qty-btn.minus {
	color: #e07040;
	border-color: #e07040;
}

.grocery-qty-btn.plus {
	color: #3a9e6e;
	border-color: #3a9e6e;
}

.grocery-qty-value {
	font-size: 13px;
	color: var(--text-normal);
	min-width: 24px;
	height: 20px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid var(--background-modifier-border);
	border-radius: 3px;
	background: var(--background-primary);
	padding: 0 4px;
}

.grocery-remove-btn {
	background: #e05252 !important;
	border: none !important;
	color: #ffffff !important;
	cursor: pointer;
	font-size: 14px;
	font-weight: 600;
	width: 24px;
	height: 24px;
	border-radius: 4px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	line-height: 1;
	flex-shrink: 0;
}

.grocery-remove-btn:hover {
	opacity: 0.85;
}

.grocery-quick-add {
	margin-top: 12px;
	padding-top: 10px;
	border-top: 1px solid var(--background-modifier-border);
}

.grocery-quick-add-label {
	font-size: 12px;
	color: var(--text-muted);
	margin-bottom: 6px;
}

.grocery-pills {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.grocery-pill {
	display: inline-flex;
	align-items: center;
	gap: 4px;
	padding: 3px 8px;
	border-radius: 999px;
	border: 1px solid var(--background-modifier-border);
	background: var(--background-primary);
	color: var(--text-normal);
	font-size: 12px;
}

.grocery-pill:hover {
	border-color: var(--interactive-accent);
	color: var(--interactive-accent);
}

.grocery-pill span {
	cursor: pointer;
}

.grocery-pill-remove {
	color: #e05252;
	cursor: pointer;
	font-size: 13px;
	line-height: 1;
	user-select: none;
	transition: color 0.1s, font-size 0.1s;
}

.grocery-pill-remove:hover {
	color: #b91c1c;
	font-size: 17px;
	font-weight: 700;
	text-shadow: 0 0 6px rgba(185, 28, 28, 0.4);
}

.grocery-footer {
	margin-top: 10px;
	padding-top: 10px;
	border-top: 1px solid var(--background-modifier-border);
}

.grocery-clear-btn {
	background: none;
	border: 1px solid var(--background-modifier-border);
	border-radius: 4px;
	color: var(--text-muted);
	cursor: pointer;
	font-size: 12px;
	padding: 4px 10px;
}

.grocery-clear-btn:hover {
	color: var(--text-normal);
	border-color: var(--text-muted);
}
`;

export default class GroceryListPlugin extends Plugin {
	data: PluginData = { ...DEFAULT_DATA };
	// Quantities are session-only and never persisted
	private quantities = new Map<string, number>();

	async onload() {
		await this.loadPluginData();
		this.injectGlobalStyles();

		this.registerMarkdownCodeBlockProcessor(
			'grocery',
			async (source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
				await this.renderGroceryList(source, el, ctx);
			}
		);
	}

	onunload() {
		document.getElementById(STYLE_ID)?.remove();
	}

	private injectGlobalStyles() {
		if (document.getElementById(STYLE_ID)) return;
		const style = document.createElement('style');
		style.id = STYLE_ID;
		style.textContent = CSS;
		document.head.appendChild(style);
	}

	private async loadPluginData() {
		const loaded = await this.loadData();
		this.data = Object.assign({ ...DEFAULT_DATA }, loaded);
	}

	private async savePluginData() {
		await this.saveData(this.data);
	}

	private async renderGroceryList(
		source: string,
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	) {
		let listId = source.trim();

		if (!listId) {
			listId = generateId();
			await this.writeListId(el, ctx, listId);
			// After writing, Obsidian will re-render — initialise the list now so
			// it is ready when the new render cycle picks it up.
		}

		if (!this.data.lists[listId]) {
			this.data.lists[listId] = [];
			await this.savePluginData();
		}

		this.buildUI(el, listId);
	}

	private async writeListId(
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext,
		listId: string
	) {
		const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
		if (!(file instanceof TFile)) return;

		const info = ctx.getSectionInfo(el);
		if (!info) return;

		const { text, lineStart, lineEnd } = info;
		const lines = text.split('\n');
		// lineStart = opening fence, lineEnd = closing fence
		// Replace everything between them with the generated ID
		lines.splice(lineStart + 1, lineEnd - lineStart - 1, listId);
		await this.app.vault.modify(file, lines.join('\n'));
	}

	// -------------------------------------------------------------------------
	// UI builder helpers — all re-render by calling buildUI again after changes
	// -------------------------------------------------------------------------

	private buildUI(container: HTMLElement, listId: string) {
		container.empty();
		const wrapper = container.createDiv({ cls: 'grocery-plugin' });

		const input = this.buildInputRow(wrapper, listId, container);
		this.buildActiveList(wrapper, listId, container);
		const pills = this.buildQuickAdd(wrapper, listId, container);
		this.buildFooter(wrapper, listId, container);

		// Filter "Add again" pills as the user types
		if (pills) {
			input.addEventListener('input', () => {
				const query = input.value.trim().toLowerCase();
				pills.querySelectorAll<HTMLButtonElement>('.grocery-pill').forEach((pill) => {
					const match = !query || pill.textContent?.toLowerCase().includes(query);
					pill.style.display = match ? '' : 'none';
				});
			});
		}
	}

	private buildInputRow(
		wrapper: HTMLElement,
		listId: string,
		container: HTMLElement
	): HTMLInputElement {
		const row = wrapper.createDiv({ cls: 'grocery-input-row' });
		const input = row.createEl('input', {
			attr: { type: 'text', placeholder: 'Add item…' },
		});
		const btn = row.createEl('button', { cls: 'grocery-add-btn', text: 'Add' });

		const addItem = async () => {
			const name = input.value.trim();
			if (!name) return;
			this.data.lists[listId].push({ name, checked: false });
			if (!this.data.library.includes(name)) {
				this.data.library.push(name);
			}
			await this.savePluginData();
			input.value = '';
			this.buildUI(container, listId);
		};

		btn.addEventListener('click', addItem);
		input.addEventListener('keydown', (e: KeyboardEvent) => {
			if (e.key === 'Enter') addItem();
		});

		return input;
	}

	private buildActiveList(
		wrapper: HTMLElement,
		listId: string,
		container: HTMLElement
	) {
		const items = this.data.lists[listId] ?? [];

		for (let index = 0; index < items.length; index++) {
			const item = items[index];
			const qtyKey = `${listId}::${item.name}`;
			if (!this.quantities.has(qtyKey)) this.quantities.set(qtyKey, 1);

			const row = wrapper.createDiv({
				cls: 'grocery-item' + (item.checked ? ' checked' : ''),
			});

			const checkbox = row.createEl('input', { attr: { type: 'checkbox' } });
			checkbox.checked = item.checked;
			checkbox.addEventListener('change', async () => {
				this.data.lists[listId][index].checked = checkbox.checked;
				await this.savePluginData();
				this.buildUI(container, listId);
			});

			row.createSpan({ cls: 'grocery-item-name', text: item.name });

			// Quantity control
			const qty = this.quantities.get(qtyKey)!;
			const qtyWrap = row.createDiv({ cls: 'grocery-qty' });

			const minusBtn = qtyWrap.createEl('button', { cls: 'grocery-qty-btn minus', text: '−' });
			const qtyLabel = qtyWrap.createSpan({ cls: 'grocery-qty-value', text: String(qty) });
			const plusBtn = qtyWrap.createEl('button', { cls: 'grocery-qty-btn plus', text: '+' });

			minusBtn.addEventListener('click', () => {
				const cur = this.quantities.get(qtyKey)!;
				if (cur <= 1) return;
				this.quantities.set(qtyKey, cur - 1);
				qtyLabel.textContent = String(cur - 1);
			});
			plusBtn.addEventListener('click', () => {
				const cur = this.quantities.get(qtyKey)!;
				this.quantities.set(qtyKey, cur + 1);
				qtyLabel.textContent = String(cur + 1);
			});

			const removeBtn = row.createEl('button', {
				cls: 'grocery-remove-btn',
				text: '×',
				attr: { 'aria-label': 'Remove item' },
			});
			removeBtn.addEventListener('click', async () => {
				this.quantities.delete(qtyKey);
				this.data.lists[listId].splice(index, 1);
				await this.savePluginData();
				this.buildUI(container, listId);
			});
		}
	}

	private buildQuickAdd(
		wrapper: HTMLElement,
		listId: string,
		container: HTMLElement
	): HTMLElement | null {
		const currentNames = new Set(
			(this.data.lists[listId] ?? []).map((i) => i.name)
		);
		const suggestions = this.data.library.filter((name) => !currentNames.has(name));
		if (suggestions.length === 0) return null;

		const section = wrapper.createDiv({ cls: 'grocery-quick-add' });
		section.createDiv({ cls: 'grocery-quick-add-label', text: 'Add again:' });
		const pills = section.createDiv({ cls: 'grocery-pills' });

		for (const name of suggestions) {
			const pill = pills.createDiv({ cls: 'grocery-pill' });

			const pillLabel = pill.createSpan({ text: name });
			pillLabel.addEventListener('click', async () => {
				this.data.lists[listId].push({ name, checked: false });
				await this.savePluginData();
				this.buildUI(container, listId);
			});

			const pillRemove = pill.createEl('span', {
				cls: 'grocery-pill-remove',
				text: '×',
				attr: { 'aria-label': 'Remove from suggestions', role: 'button' },
			});
			pillRemove.addEventListener('click', async (e) => {
				e.stopPropagation();
				this.data.library = this.data.library.filter((n) => n !== name);
				await this.savePluginData();
				this.buildUI(container, listId);
			});
		}

		return pills;
	}

	private buildFooter(
		wrapper: HTMLElement,
		listId: string,
		container: HTMLElement
	) {
		const hasChecked = (this.data.lists[listId] ?? []).some((i) => i.checked);
		if (!hasChecked) return;

		const footer = wrapper.createDiv({ cls: 'grocery-footer' });
		const clearBtn = footer.createEl('button', {
			cls: 'grocery-clear-btn',
			text: 'Clear checked',
		});
		clearBtn.addEventListener('click', async () => {
			this.data.lists[listId]
				.filter((i) => i.checked)
				.forEach((i) => this.quantities.delete(`${listId}::${i.name}`));
			this.data.lists[listId] = this.data.lists[listId].filter((i) => !i.checked);
			await this.savePluginData();
			this.buildUI(container, listId);
		});
	}
}
