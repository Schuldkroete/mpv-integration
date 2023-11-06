import { App, Editor, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MpvIntegrationPluginSettings {
	mpv_domain_filter: string;
	mpv_file_extension_filter: string;
	mpv_url_filter: string;
}

const DEFAULT_SETTINGS: MpvIntegrationPluginSettings = {
	mpv_domain_filter: 'www.youtube.com',
	mpv_file_extension_filter: '.mp4,.mkv',
	mpv_url_filter: ''
}

export default class MpvIntegrationPlugin extends Plugin {
	settings: MpvIntegrationPluginSettings;

	async playInMpv(view: MarkdownView, editor: Editor) {

	}

	async onload() {
		await this.loadSettings();

		this.addRibbonIcon('play-circle', 'Play in mpv', (evt: MouseEvent) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (view) {
				this.playInMpv(view, view.editor);
			}
		});

		this.addCommand({
			id: 'mpv-integration-play-in-mpv',
			name: 'Play current file in mpv',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.playInMpv(view, editor);
			}
		});

		this.addSettingTab(new MpvIntegrationSettingTab(this.app, this));
	}

	onunload() {

	}

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
			.setDesc('List of Domains that should be sent to mpv.')
			.addText(text => text
				.setPlaceholder('domains')
				.setValue(this.plugin.settings.mpv_domain_filter)
				.onChange(async (value) => {
					this.plugin.settings.mpv_domain_filter = value;
					await this.plugin.saveSettings();
				}
			)
		);

		const mpv_file_extension_filter_setting = new Setting(containerEl);
		mpv_file_extension_filter_setting
			.setName('File Type Filter')
			.setDesc('List of File Extensions that should be sent to mpv.')
			.addText(text => text
				.setPlaceholder('extensions')
				.setValue(this.plugin.settings.mpv_file_extension_filter)
				.onChange(async (value) => {
					this.plugin.settings.mpv_file_extension_filter = value;
					await this.plugin.saveSettings();
				}
			)
		);

		const mpv_url_filter_setting = new Setting(containerEl);
		mpv_url_filter_setting
			.setName('URL Filter')
			.setDesc('List of URLs that should be sent to mpv.')
			.addText(text => text
				.setPlaceholder('URLs')
				.setValue(this.plugin.settings.mpv_url_filter)
				.onChange(async (value) => {
					this.plugin.settings.mpv_url_filter = value;
					await this.plugin.saveSettings();
				}
			)
		);
	}
}
