import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { spawn } from 'child_process';
import { tmpdir } from 'os';
import { open } from 'fs/promises';

interface MpvIntegrationPluginSettings {
	mpv_domain_filter: string;
	mpv_file_extension_filter: string;
	mpv_url_filter: string;
}

const DEFAULT_SETTINGS: MpvIntegrationPluginSettings = {
	mpv_domain_filter: 'youtube.com\nyoutu.be\nreddit.com\ntwitch.tv',
	mpv_file_extension_filter: 'mp4\nwebm\nmkv\nflv\navi\nwmv\nmpg\nmpeg\n3gp',
	mpv_url_filter: ''
}

export default class MpvIntegrationPlugin extends Plugin {
	settings: MpvIntegrationPluginSettings;

	md_links_regex = /\[.+\]\((https?:\/\/[\w\d:/?#[\]@!$&'()*+,;=.~-]+?)\)/g;
	url_domain_regex = /^https:\/\/([\w\d-.]+)\/.*/;

	async playInMpv(view: MarkdownView) {
		const text = view.getViewData();

		const document_urls = [...text.matchAll(this.md_links_regex)].map((m) => m[1]);
		const filtered_urls = [];

		for(const document_url of document_urls) {
			// domain filter
			let domain_filter_pass = false;
			if (this.settings.mpv_domain_filter.length > 0) {
				const url_matches = document_url.match(this.url_domain_regex)
				if(url_matches) {
					const url_domain = url_matches[1]
					for(const mpv_domain_filter_entry of this.settings.mpv_domain_filter.split("\n"))
						if(url_domain.endsWith(mpv_domain_filter_entry))
							domain_filter_pass = true;
				}
			}

			// file extension filter
			let file_extension_filter_pass = false;
			if (this.settings.mpv_file_extension_filter.length > 0) {
				for(const mpv_file_extension_filter_entry of this.settings.mpv_file_extension_filter.split("\n"))
					if(document_url.endsWith("." + mpv_file_extension_filter_entry))
						file_extension_filter_pass = true;
			}

			// generic url regex filter
			let url_filter_pass = false;
			if (this.settings.mpv_url_filter.length > 0) {
				for(const mpv_url_filter_entry of this.settings.mpv_url_filter.split("\n")) {
					const mpv_url_filter_entry_regex = new RegExp(mpv_url_filter_entry);
					if(mpv_url_filter_entry_regex.test(document_url))
						url_filter_pass = true;
				}
			}

			if(domain_filter_pass || file_extension_filter_pass || url_filter_pass)
				filtered_urls.push(document_url);
		}

		// create temporary playlist file
		const tmp_playlist_file_path = tmpdir() + '/mpvlist';
		const tmp_playlist_file = await open(tmp_playlist_file_path, 'w');
		await tmp_playlist_file.writeFile(filtered_urls.join('\n'));
		await tmp_playlist_file.close();
		

		// start mpv and detach it from obsidians process
		const mpv_process = spawn('mpv', ['--playlist=' + tmp_playlist_file_path], {detached: true, stdio: ['ignore', 'ignore', 'ignore']});
		mpv_process.disconnect();
		mpv_process.unref();
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
