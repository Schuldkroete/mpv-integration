import { App, MarkdownView, Modal, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MpvIntegrationPluginSettings {
	mpv_domain_filter: string;
	mpv_file_extension_filter: string;
	mpv_url_filter: string;
}

const DEFAULT_SETTINGS: MpvIntegrationPluginSettings = {
	mpv_domain_filter: 'youtube.com\nyoutu.be\nreddit.com\ntwitch.tv',
	mpv_file_extension_filter: 'mp4\nwebm\nmkv\nflv\navi\nwmv\nmpg\nmpeg\n3gp;',
	mpv_url_filter: ''
}

export default class MpvIntegrationPlugin extends Plugin {
	settings: MpvIntegrationPluginSettings;

	async playInMpv(view: MarkdownView) {
		const mod = new Modal(this.app);
		mod.contentEl.textContent = view.getViewData();
		mod.open()
	}

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('play-circle', 'Play in mpv', (evt: MouseEvent) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				this.playInMpv(view);
			}
		});

		this.addCommand({
			id: 'mpv-integration-play-in-mpv',
			name: 'Play current file in mpv',
			checkCallback: (checking: boolean) => {
				// check if a document is open
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);

				if (markdownView) {
					if (!checking) {
						this.playInMpv(markdownView);
					}
					return true
				}
				return false;
			}
		});

		this.addSettingTab(new MpvIntegrationSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class MpvIntegrationSettingTab extends PluginSettingTab {
	plugin: MpvIntegrationPlugin;

	constructor(app: App, plugin: MpvIntegrationPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		const mpv_domain_filter_setting = new Setting(containerEl);
		mpv_domain_filter_setting
			.setName('Domain Filter')
			.setDesc('List of allowed Domains. (one per line)')
			.addTextArea(text => {
				text.setValue(this.plugin.settings.mpv_domain_filter)
					.onChange(async (value) => {
						this.plugin.settings.mpv_domain_filter = value;
						await this.plugin.saveSettings();
					}
				);
				text.inputEl.rows = 10;
				text.inputEl.cols = 25;
			}
		);

		const mpv_file_extension_filter_setting = new Setting(containerEl);
		mpv_file_extension_filter_setting
			.setName('File Type Filter')
			.setDesc('List of allowed File Extensions. (one per line)')
			.addTextArea(text => {
				text.setValue(this.plugin.settings.mpv_file_extension_filter)
					.onChange(async (value) => {
						this.plugin.settings.mpv_file_extension_filter = value;
						await this.plugin.saveSettings();
					}
				);
				text.inputEl.rows = 10;
				text.inputEl.cols = 25;
			}
		);

		const mpv_url_filter_setting = new Setting(containerEl);
		mpv_url_filter_setting
			.setName('URL Filter')
			.setDesc('Only needed, in a few cases: List of allowed URLs. (regex, one per line)')
			.addTextArea(text => {
				text.setValue(this.plugin.settings.mpv_url_filter)
					.onChange(async (value) => {
						this.plugin.settings.mpv_url_filter = value;
						await this.plugin.saveSettings();
					}
				);
				text.inputEl.rows = 10;
				text.inputEl.cols = 25;
			}
		);
	}
}
