
#!/usr/bin/env python3
"""
Local Audio Transcription Tool - Main Application

This script provides a simple GUI to:
1. Select audio files from the local filesystem
2. Transcribe audio using the Deepgram API
3. Correct transcripts using OpenAI API
4. Save all files locally
"""

import os
import sys
import json
import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from tkinter.scrolledtext import ScrolledText
import configparser
from pathlib import Path
import threading
import time
from datetime import datetime
import re
import glob

# Import local modules
from transcribe import transcribe_audio_with_deepgram
from correct import correct_transcript_with_openai, TranscriptionCorrectionError

class TranscriptionApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Local Audio Transcription Tool")
        self.root.geometry("900x700")
        self.root.minsize(800, 600)
        
        # Set theme
        self.style = ttk.Style()
        try:
            self.style.theme_use("clam")
        except:
            pass
        
        # Configure colors
        self.style.configure("TButton", padding=6, relief="flat")
        self.style.configure("TLabel", padding=4)
        self.style.configure("TCheckbutton", padding=4)
        
        # Create or load configuration
        self.config = configparser.ConfigParser()
        self.config_file = "config.ini"
        self.load_config()
        
        # Create directory structure
        self.create_directories()
        
        # Create main frame with notebook for tabs
        self.main_frame = ttk.Frame(self.root, padding="10")
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Create notebook for tabs
        self.notebook = ttk.Notebook(self.main_frame)
        self.notebook.pack(fill=tk.BOTH, expand=True, pady=5)
        
        # Create tabs
        self.single_file_tab = ttk.Frame(self.notebook, padding="10")
        self.batch_tab = ttk.Frame(self.notebook, padding="10")
        self.settings_tab = ttk.Frame(self.notebook, padding="10")
        
        self.notebook.add(self.single_file_tab, text="Single File")
        self.notebook.add(self.batch_tab, text="Batch Processing")
        self.notebook.add(self.settings_tab, text="Settings")
        
        # Create UI elements for single file tab
        self.create_single_file_tab()
        
        # Create UI elements for batch processing tab
        self.create_batch_tab()
        
        # Create UI elements for settings tab
        self.create_settings_tab()
        
        # Initialize variables
        self.selected_file = None
        self.batch_files = []
        self.transcription_result = None
        self.corrected_result = None
        self.current_batch_file = None
        self.batch_processing_active = False
        
        # Status bar
        self.status_bar = ttk.Label(self.root, text="Ready", relief=tk.SUNKEN, anchor=tk.W)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Set initial status
        self.update_status("Application started. Ready to process audio files.")
        
    def create_directories(self):
        """Create necessary directories if they don't exist"""
        os.makedirs("audio_files", exist_ok=True)
        os.makedirs("transcripts", exist_ok=True)
        os.makedirs("corrected_transcripts", exist_ok=True)
        os.makedirs("batch_results", exist_ok=True)

    def load_config(self):
        """Load configuration from file or create default"""
        if os.path.exists(self.config_file):
            self.config.read(self.config_file)
        
        # Ensure sections exist
        if 'API_KEYS' not in self.config:
            self.config['API_KEYS'] = {}
        if 'SETTINGS' not in self.config:
            self.config['SETTINGS'] = {}
        if 'DEEPGRAM_OPTIONS' not in self.config:
            self.config['DEEPGRAM_OPTIONS'] = {}
        if 'OPENAI_OPTIONS' not in self.config:
            self.config['OPENAI_OPTIONS'] = {}
            
        # Set defaults if not present
        if 'deepgram_api_key' not in self.config['API_KEYS']:
            self.config['API_KEYS']['deepgram_api_key'] = ''
        if 'openai_api_key' not in self.config['API_KEYS']:
            self.config['API_KEYS']['openai_api_key'] = ''
        
        # Set default Deepgram options
        for option, default in [
            ('model', 'nova-2'),
            ('punctuate', 'true'),
            ('diarize', 'false'),
            ('smart_format', 'true'),
            ('language', 'auto'),
            ('detect_language', 'true'),
            ('summarize', 'false'),
            ('detect_topics', 'false'),
            ('utterances', 'false'),
            ('profanity_filter', 'false'),
            ('redact', ''),
            ('alternatives', '1')
        ]:
            if option not in self.config['DEEPGRAM_OPTIONS']:
                self.config['DEEPGRAM_OPTIONS'][option] = default
        
        # Set default OpenAI options
        for option, default in [
            ('model', 'gpt-4o'),
            ('temperature', '0.2'),
            ('max_retries', '2'),
            ('format_output', 'false'),
            ('extract_speakers', 'false'),
            ('extract_topics', 'false'),
            ('clean_filler_words', 'true')
        ]:
            if option not in self.config['OPENAI_OPTIONS']:
                self.config['OPENAI_OPTIONS'][option] = default
            
    def save_config(self):
        """Save configuration to file"""
        # Update config with current values
        self.config['API_KEYS']['deepgram_api_key'] = self.deepgram_api_key_var.get()
        self.config['API_KEYS']['openai_api_key'] = self.openai_api_key_var.get()
        
        # Update Deepgram options
        self.config['DEEPGRAM_OPTIONS']['model'] = self.model_var.get()
        self.config['DEEPGRAM_OPTIONS']['punctuate'] = str(self.punctuate_var.get()).lower()
        self.config['DEEPGRAM_OPTIONS']['diarize'] = str(self.diarize_var.get()).lower()
        self.config['DEEPGRAM_OPTIONS']['smart_format'] = str(self.smart_format_var.get()).lower()
        self.config['DEEPGRAM_OPTIONS']['language'] = self.language_var.get()
        self.config['DEEPGRAM_OPTIONS']['detect_language'] = str(self.detect_language_var.get()).lower()
        self.config['DEEPGRAM_OPTIONS']['summarize'] = str(self.summarize_var.get()).lower()
        self.config['DEEPGRAM_OPTIONS']['detect_topics'] = str(self.detect_topics_var.get()).lower()
        self.config['DEEPGRAM_OPTIONS']['utterances'] = str(self.utterances_var.get()).lower()
        self.config['DEEPGRAM_OPTIONS']['profanity_filter'] = str(self.profanity_filter_var.get()).lower()
        self.config['DEEPGRAM_OPTIONS']['redact'] = self.redact_var.get()
        self.config['DEEPGRAM_OPTIONS']['alternatives'] = str(self.alternatives_var.get())
        
        # Update OpenAI options
        self.config['OPENAI_OPTIONS']['model'] = self.openai_model_var.get()
        self.config['OPENAI_OPTIONS']['temperature'] = str(self.temperature_var.get())
        self.config['OPENAI_OPTIONS']['max_retries'] = str(self.max_retries_var.get())
        self.config['OPENAI_OPTIONS']['format_output'] = str(self.format_output_var.get()).lower()
        self.config['OPENAI_OPTIONS']['extract_speakers'] = str(self.extract_speakers_var.get()).lower()
        self.config['OPENAI_OPTIONS']['extract_topics'] = str(self.extract_topics_var.get()).lower()
        self.config['OPENAI_OPTIONS']['clean_filler_words'] = str(self.clean_filler_words_var.get()).lower()
        
        # Write to file
        with open(self.config_file, 'w') as f:
            self.config.write(f)
        
        messagebox.showinfo("Configuration", "Settings saved successfully")

    def create_single_file_tab(self):
        """Create the UI elements for the single file tab"""
        # Create frames for organization
        file_frame = ttk.LabelFrame(self.single_file_tab, text="Audio File Selection", padding="10")
        file_frame.pack(fill=tk.X, pady=10)
        
        options_frame = ttk.LabelFrame(self.single_file_tab, text="Transcription Options", padding="10")
        options_frame.pack(fill=tk.X, pady=10)
        
        status_frame = ttk.LabelFrame(self.single_file_tab, text="Status & Logs", padding="10")
        status_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # File selection UI
        ttk.Label(file_frame, text="Selected File:").grid(column=0, row=0, sticky=tk.W, pady=5)
        self.file_label = ttk.Label(file_frame, text="No file selected")
        self.file_label.grid(column=1, row=0, sticky=tk.W, pady=5)
        
        ttk.Button(file_frame, text="Browse Files...", command=self.select_file).grid(column=0, row=1, pady=10)
        ttk.Button(file_frame, text="Clear Selection", command=self.clear_file_selection).grid(column=1, row=1, pady=10, padx=5)
        
        # Display file info when selected
        self.file_info_label = ttk.Label(file_frame, text="")
        self.file_info_label.grid(column=0, row=2, columnspan=2, sticky=tk.W, pady=5)
        
        # Options frames
        self.create_options_ui(options_frame)
        
        # Status and logs
        self.create_status_ui(status_frame)
        
        # Action buttons
        self.create_action_buttons(self.single_file_tab)

    def create_batch_tab(self):
        """Create the UI elements for batch processing"""
        # Batch file selection frame
        batch_file_frame = ttk.LabelFrame(self.batch_tab, text="Batch File Selection", padding="10")
        batch_file_frame.pack(fill=tk.X, pady=10)
        
        ttk.Button(batch_file_frame, text="Add Files...", command=self.add_batch_files).pack(side=tk.LEFT, padx=5, pady=10)
        ttk.Button(batch_file_frame, text="Add Folder...", command=self.add_batch_folder).pack(side=tk.LEFT, padx=5, pady=10)
        ttk.Button(batch_file_frame, text="Clear All", command=self.clear_batch_files).pack(side=tk.LEFT, padx=5, pady=10)
        
        # Batch file list
        list_frame = ttk.Frame(batch_file_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        ttk.Label(list_frame, text="Selected Files:").pack(anchor=tk.W)
        
        # Create scrollable listbox
        listbox_frame = ttk.Frame(list_frame)
        listbox_frame.pack(fill=tk.BOTH, expand=True)
        
        scrollbar = ttk.Scrollbar(listbox_frame)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.batch_listbox = tk.Listbox(listbox_frame, height=6, selectmode=tk.EXTENDED, yscrollcommand=scrollbar.set)
        self.batch_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        scrollbar.config(command=self.batch_listbox.yview)
        
        # File count label
        self.batch_count_label = ttk.Label(list_frame, text="0 files selected")
        self.batch_count_label.pack(anchor=tk.W, pady=5)
        
        # Batch progress frame
        self.batch_progress_frame = ttk.LabelFrame(self.batch_tab, text="Batch Progress", padding="10")
        self.batch_progress_frame.pack(fill=tk.X, pady=10)
        
        self.batch_progress = ttk.Progressbar(self.batch_progress_frame, orient=tk.HORIZONTAL, length=100, mode='determinate')
        self.batch_progress.pack(fill=tk.X, pady=5)
        
        self.batch_progress_label = ttk.Label(self.batch_progress_frame, text="Ready")
        self.batch_progress_label.pack(anchor=tk.W, pady=5)
        
        # Batch status
        self.batch_status_frame = ttk.LabelFrame(self.batch_tab, text="Batch Status", padding="10")
        self.batch_status_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        self.batch_status_text = ScrolledText(self.batch_status_frame, height=10)
        self.batch_status_text.pack(fill=tk.BOTH, expand=True)
        self.batch_status_text.config(state=tk.DISABLED)
        
        # Action buttons
        button_frame = ttk.Frame(self.batch_tab)
        button_frame.pack(fill=tk.X, pady=10)
        
        ttk.Button(button_frame, text="Start Batch Processing", command=self.start_batch_processing).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Stop Processing", command=self.stop_batch_processing).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Open Results Folder", command=lambda: self.open_folder("batch_results")).pack(side=tk.LEFT, padx=5)

    def create_settings_tab(self):
        """Create the UI elements for the settings tab"""
        # API Keys frame
        api_keys_frame = ttk.LabelFrame(self.settings_tab, text="API Keys", padding="10")
        api_keys_frame.pack(fill=tk.X, pady=10)
        
        # Deepgram API Key
        ttk.Label(api_keys_frame, text="Deepgram API Key:").grid(column=0, row=0, sticky=tk.W, pady=5)
        self.deepgram_api_key_var = tk.StringVar(value=self.config['API_KEYS']['deepgram_api_key'])
        self.deepgram_key_entry = ttk.Entry(api_keys_frame, width=50, show="*", textvariable=self.deepgram_api_key_var)
        self.deepgram_key_entry.grid(column=1, row=0, padx=5)
        self.deepgram_show_key = tk.BooleanVar(value=False)
        ttk.Checkbutton(api_keys_frame, text="Show", variable=self.deepgram_show_key, 
                        command=lambda: self.toggle_key_visibility(self.deepgram_key_entry, self.deepgram_show_key)).grid(column=2, row=0)
        
        # OpenAI API Key
        ttk.Label(api_keys_frame, text="OpenAI API Key:").grid(column=0, row=1, sticky=tk.W, pady=5)
        self.openai_api_key_var = tk.StringVar(value=self.config['API_KEYS']['openai_api_key'])
        self.openai_key_entry = ttk.Entry(api_keys_frame, width=50, show="*", textvariable=self.openai_api_key_var)
        self.openai_key_entry.grid(column=1, row=1, padx=5)
        self.openai_show_key = tk.BooleanVar(value=False)
        ttk.Checkbutton(api_keys_frame, text="Show", variable=self.openai_show_key, 
                         command=lambda: self.toggle_key_visibility(self.openai_key_entry, self.openai_show_key)).grid(column=2, row=1)
        
        # Create notebook for advanced settings
        settings_notebook = ttk.Notebook(self.settings_tab)
        settings_notebook.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # Deepgram Settings Tab
        deepgram_settings = ttk.Frame(settings_notebook, padding="10")
        settings_notebook.add(deepgram_settings, text="Deepgram Settings")
        
        # Deepgram model selection
        ttk.Label(deepgram_settings, text="Model:").grid(column=0, row=0, sticky=tk.W, pady=5)
        self.model_var = tk.StringVar(value=self.config['DEEPGRAM_OPTIONS']['model'])
        models = ["nova-2", "nova", "enhanced", "base"]
        model_dropdown = ttk.Combobox(deepgram_settings, textvariable=self.model_var, values=models, state="readonly", width=15)
        model_dropdown.grid(column=1, row=0, sticky=tk.W, pady=5, padx=5)
        
        # Language selection
        ttk.Label(deepgram_settings, text="Language:").grid(column=0, row=1, sticky=tk.W, pady=5)
        self.language_var = tk.StringVar(value=self.config['DEEPGRAM_OPTIONS']['language'])
        languages = ["auto", "en", "es", "fr", "de", "it", "pt", "nl", "ja", "zh", "hi", "ru"]
        language_dropdown = ttk.Combobox(deepgram_settings, textvariable=self.language_var, values=languages, state="readonly", width=15)
        language_dropdown.grid(column=1, row=1, sticky=tk.W, pady=5, padx=5)
        
        # Alternatives
        ttk.Label(deepgram_settings, text="Alternatives:").grid(column=0, row=2, sticky=tk.W, pady=5)
        self.alternatives_var = tk.IntVar(value=int(self.config['DEEPGRAM_OPTIONS']['alternatives']))
        alt_spin = ttk.Spinbox(deepgram_settings, from_=1, to=10, textvariable=self.alternatives_var, width=5)
        alt_spin.grid(column=1, row=2, sticky=tk.W, padx=5, pady=5)
        
        # Redact terms
        ttk.Label(deepgram_settings, text="Redact Terms:").grid(column=0, row=3, sticky=tk.W, pady=5)
        self.redact_var = tk.StringVar(value=self.config['DEEPGRAM_OPTIONS']['redact'])
        ttk.Entry(deepgram_settings, textvariable=self.redact_var, width=30).grid(column=1, row=3, sticky=tk.W, padx=5, pady=5)
        ttk.Label(deepgram_settings, text="Comma separated").grid(column=2, row=3, sticky=tk.W)
        
        # Feature toggles
        self.punctuate_var = tk.BooleanVar(value=self.config['DEEPGRAM_OPTIONS']['punctuate'].lower() == 'true')
        self.diarize_var = tk.BooleanVar(value=self.config['DEEPGRAM_OPTIONS']['diarize'].lower() == 'true')
        self.smart_format_var = tk.BooleanVar(value=self.config['DEEPGRAM_OPTIONS']['smart_format'].lower() == 'true')
        self.detect_language_var = tk.BooleanVar(value=self.config['DEEPGRAM_OPTIONS']['detect_language'].lower() == 'true')
        self.summarize_var = tk.BooleanVar(value=self.config['DEEPGRAM_OPTIONS']['summarize'].lower() == 'true')
        self.detect_topics_var = tk.BooleanVar(value=self.config['DEEPGRAM_OPTIONS']['detect_topics'].lower() == 'true')
        self.utterances_var = tk.BooleanVar(value=self.config['DEEPGRAM_OPTIONS']['utterances'].lower() == 'true')
        self.profanity_filter_var = tk.BooleanVar(value=self.config['DEEPGRAM_OPTIONS']['profanity_filter'].lower() == 'true')
        
        # Feature checkboxes - left column
        ttk.Checkbutton(deepgram_settings, text="Punctuation", variable=self.punctuate_var).grid(
            column=0, row=4, sticky=tk.W, pady=2)
        ttk.Checkbutton(deepgram_settings, text="Speaker Diarization", variable=self.diarize_var).grid(
            column=0, row=5, sticky=tk.W, pady=2)
        ttk.Checkbutton(deepgram_settings, text="Smart Formatting", variable=self.smart_format_var).grid(
            column=0, row=6, sticky=tk.W, pady=2)
        ttk.Checkbutton(deepgram_settings, text="Detect Language", variable=self.detect_language_var).grid(
            column=0, row=7, sticky=tk.W, pady=2)
        
        # Feature checkboxes - right column
        ttk.Checkbutton(deepgram_settings, text="Summarize", variable=self.summarize_var).grid(
            column=1, row=4, sticky=tk.W, pady=2)
        ttk.Checkbutton(deepgram_settings, text="Detect Topics", variable=self.detect_topics_var).grid(
            column=1, row=5, sticky=tk.W, pady=2)
        ttk.Checkbutton(deepgram_settings, text="Utterances", variable=self.utterances_var).grid(
            column=1, row=6, sticky=tk.W, pady=2)
        ttk.Checkbutton(deepgram_settings, text="Profanity Filter", variable=self.profanity_filter_var).grid(
            column=1, row=7, sticky=tk.W, pady=2)
        
        # OpenAI Settings Tab
        openai_settings = ttk.Frame(settings_notebook, padding="10")
        settings_notebook.add(openai_settings, text="OpenAI Settings")
        
        # OpenAI model selection
        ttk.Label(openai_settings, text="Model:").grid(column=0, row=0, sticky=tk.W, pady=5)
        self.openai_model_var = tk.StringVar(value=self.config['OPENAI_OPTIONS']['model'])
        openai_models = ["gpt-4o", "gpt-3.5-turbo", "gpt-4o-mini"]
        openai_model_dropdown = ttk.Combobox(openai_settings, textvariable=self.openai_model_var, values=openai_models, state="readonly", width=15)
        openai_model_dropdown.grid(column=1, row=0, sticky=tk.W, pady=5, padx=5)
        
        # Temperature
        ttk.Label(openai_settings, text="Temperature:").grid(column=0, row=1, sticky=tk.W, pady=5)
        self.temperature_var = tk.DoubleVar(value=float(self.config['OPENAI_OPTIONS']['temperature']))
        temperature_spin = ttk.Spinbox(openai_settings, from_=0.0, to=1.0, increment=0.1, textvariable=self.temperature_var, width=5)
        temperature_spin.grid(column=1, row=1, sticky=tk.W, padx=5, pady=5)
        
        # Max Retries
        ttk.Label(openai_settings, text="Max Retries:").grid(column=0, row=2, sticky=tk.W, pady=5)
        self.max_retries_var = tk.IntVar(value=int(self.config['OPENAI_OPTIONS']['max_retries']))
        max_retries_spin = ttk.Spinbox(openai_settings, from_=1, to=5, textvariable=self.max_retries_var, width=5)
        max_retries_spin.grid(column=1, row=2, sticky=tk.W, padx=5, pady=5)
        
        # OpenAI feature toggles
        self.format_output_var = tk.BooleanVar(value=self.config['OPENAI_OPTIONS']['format_output'].lower() == 'true')
        self.extract_speakers_var = tk.BooleanVar(value=self.config['OPENAI_OPTIONS']['extract_speakers'].lower() == 'true')
        self.extract_topics_var = tk.BooleanVar(value=self.config['OPENAI_OPTIONS']['extract_topics'].lower() == 'true')
        self.clean_filler_words_var = tk.BooleanVar(value=self.config['OPENAI_OPTIONS']['clean_filler_words'].lower() == 'true')
        
        # OpenAI feature checkboxes
        ttk.Checkbutton(openai_settings, text="Format Output as JSON", variable=self.format_output_var).grid(
            column=0, row=3, sticky=tk.W, pady=2)
        ttk.Checkbutton(openai_settings, text="Extract Speakers", variable=self.extract_speakers_var).grid(
            column=0, row=4, sticky=tk.W, pady=2)
        ttk.Checkbutton(openai_settings, text="Extract Topics", variable=self.extract_topics_var).grid(
            column=1, row=3, sticky=tk.W, pady=2)
        ttk.Checkbutton(openai_settings, text="Clean Filler Words", variable=self.clean_filler_words_var).grid(
            column=1, row=4, sticky=tk.W, pady=2)
        
        # Save settings button
        ttk.Button(self.settings_tab, text="Save Settings", command=self.save_config).pack(pady=15)
        
        # Help text
        help_frame = ttk.LabelFrame(self.settings_tab, text="Help", padding="10")
        help_frame.pack(fill=tk.X, pady=10)
        
        help_text = (
            "• API keys are stored locally in the config.ini file\n"
            "• Deepgram provides AI-powered audio transcription\n"
            "• OpenAI provides AI correction of the transcripts\n"
            "• All processed files are stored locally\n\n"
            "For more information, visit:\n"
            "Deepgram: https://deepgram.com/\n"
            "OpenAI: https://openai.com/"
        )
        
        help_label = ttk.Label(help_frame, text=help_text, justify=tk.LEFT)
        help_label.pack(fill=tk.X, pady=5)

    def create_options_ui(self, parent_frame):
        """Create common transcription options UI"""
        # We'll only show a subset of options in the main UI
        # Full options are available in settings
        
        # Deepgram model selection
        ttk.Label(parent_frame, text="Deepgram Model:").grid(column=0, row=0, sticky=tk.W, pady=5)
        model_dropdown = ttk.Combobox(parent_frame, textvariable=self.model_var, 
                                      values=["nova-2", "nova", "enhanced", "base"], 
                                      state="readonly", width=10)
        model_dropdown.grid(column=1, row=0, sticky=tk.W, pady=5, padx=5)
        
        # Language selection
        ttk.Label(parent_frame, text="Language:").grid(column=2, row=0, sticky=tk.W, pady=5)
        language_dropdown = ttk.Combobox(parent_frame, textvariable=self.language_var, 
                                        values=["auto", "en", "es", "fr", "de", "it", "pt", "nl", "ja", "zh", "hi", "ru"], 
                                        state="readonly", width=5)
        language_dropdown.grid(column=3, row=0, sticky=tk.W, pady=5, padx=5)
        
        # Feature toggles - row 1
        ttk.Checkbutton(parent_frame, text="Punctuation", variable=self.punctuate_var).grid(
            column=0, row=1, sticky=tk.W, pady=2)
        ttk.Checkbutton(parent_frame, text="Speaker Diarization", variable=self.diarize_var).grid(
            column=1, row=1, sticky=tk.W, pady=2)
        ttk.Checkbutton(parent_frame, text="Smart Formatting", variable=self.smart_format_var).grid(
            column=2, row=1, sticky=tk.W, pady=2)
        ttk.Checkbutton(parent_frame, text="Detect Topics", variable=self.detect_topics_var).grid(
            column=3, row=1, sticky=tk.W, pady=2)
        
        # OpenAI model
        ttk.Label(parent_frame, text="OpenAI Model:").grid(column=0, row=2, sticky=tk.W, pady=5)
        openai_model_dropdown = ttk.Combobox(parent_frame, textvariable=self.openai_model_var, 
                                            values=["gpt-4o", "gpt-3.5-turbo", "gpt-4o-mini"], 
                                            state="readonly", width=10)
        openai_model_dropdown.grid(column=1, row=2, sticky=tk.W, pady=5, padx=5)
        
        # Common OpenAI options
        ttk.Checkbutton(parent_frame, text="Clean Filler Words", variable=self.clean_filler_words_var).grid(
            column=2, row=2, sticky=tk.W, pady=2)
        ttk.Checkbutton(parent_frame, text="Extract Speakers", variable=self.extract_speakers_var).grid(
            column=3, row=2, sticky=tk.W, pady=2)
        
        # Options note
        ttk.Label(parent_frame, text="Note: More options are available in the Settings tab").grid(
            column=0, row=3, columnspan=4, sticky=tk.W, pady=5)

    def create_status_ui(self, parent_frame):
        """Create status and log UI elements"""
        # Status text widget
        self.status_text = ScrolledText(parent_frame, height=10)
        self.status_text.pack(fill=tk.BOTH, expand=True)
        self.status_text.config(state=tk.DISABLED)
        
        # Progress bar
        self.progress_frame = ttk.Frame(parent_frame)
        self.progress_frame.pack(fill=tk.X, pady=5)
        
        self.progress_label = ttk.Label(self.progress_frame, text="Progress:")
        self.progress_label.pack(side=tk.LEFT, padx=5)
        
        self.progress = ttk.Progressbar(self.progress_frame, orient=tk.HORIZONTAL, length=100, mode='determinate')
        self.progress.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=5)
        
        self.progress_value = ttk.Label(self.progress_frame, text="0%")
        self.progress_value.pack(side=tk.LEFT, padx=5)

    def create_action_buttons(self, parent_frame):
        """Create action buttons at the bottom of the UI"""
        buttons_frame = ttk.Frame(parent_frame)
        buttons_frame.pack(fill=tk.X, pady=10)
        
        ttk.Button(buttons_frame, text="Transcribe Audio", command=self.transcribe_audio).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="Correct Transcript (OpenAI)", command=self.correct_transcript).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="Save Results", command=self.save_results).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="Preview Results", command=self.preview_results).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="Open Output Folder", command=lambda: self.open_folder("transcripts")).pack(side=tk.RIGHT, padx=5)

    def toggle_key_visibility(self, entry_widget, var):
        """Toggle showing/hiding API key"""
        if var.get():
            entry_widget.config(show="")
        else:
            entry_widget.config(show="*")

    def update_status(self, message):
        """Update status bar with message"""
        self.status_bar.config(text=message)
        self.root.update_idletasks()

    def log(self, message):
        """Add message to status text with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        full_message = f"[{timestamp}] {message}\n"
        
        self.status_text.config(state=tk.NORMAL)
        self.status_text.insert(tk.END, full_message)
        self.status_text.see(tk.END)
        self.status_text.config(state=tk.DISABLED)
        self.root.update_idletasks()
    
    def batch_log(self, message):
        """Add message to batch status text with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        full_message = f"[{timestamp}] {message}\n"
        
        self.batch_status_text.config(state=tk.NORMAL)
        self.batch_status_text.insert(tk.END, full_message)
        self.batch_status_text.see(tk.END)
        self.batch_status_text.config(state=tk.DISABLED)
        self.root.update_idletasks()

    def select_file(self):
        """Open file selection dialog"""
        filetypes = [
            ("Audio files", "*.mp3 *.wav *.flac *.m4a *.ogg *.aac"),
            ("All files", "*.*")
        ]
        
        filename = filedialog.askopenfilename(
            title="Select Audio File",
            filetypes=filetypes
        )
        
        if filename:
            self.selected_file = filename
            file_size = os.path.getsize(filename) / (1024 * 1024)  # MB
            file_name = os.path.basename(filename)
            
            self.file_label.config(text=file_name)
            self.file_info_label.config(text=f"File size: {file_size:.2f} MB")
            self.log(f"Selected file: {filename}")
            self.update_status(f"File selected: {file_name}")
            
            # Copy file to audio_files directory
            try:
                import shutil
                dest_path = os.path.join("audio_files", file_name)
                shutil.copy2(filename, dest_path)
                self.log(f"File copied to audio_files directory: {dest_path}")
            except Exception as e:
                self.log(f"Warning: Could not copy file to audio_files directory: {str(e)}")
        else:
            self.log("No file selected")
    
    def clear_file_selection(self):
        """Clear the selected file"""
        self.selected_file = None
        self.file_label.config(text="No file selected")
        self.file_info_label.config(text="")
        self.log("File selection cleared")
        self.update_status("Ready to select a file")

    def get_deepgram_options(self):
        """Get current Deepgram options as dictionary"""
        options = {
            "model": self.model_var.get(),
            "punctuate": self.punctuate_var.get(),
            "diarize": self.diarize_var.get(),
            "smart_format": self.smart_format_var.get(),
            "language": self.language_var.get() if self.language_var.get() != "auto" else None,
            "detect_language": self.detect_language_var.get(),
            "summarize": self.summarize_var.get(),
            "detect_topics": self.detect_topics_var.get(),
            "utterances": self.utterances_var.get(),
            "profanity_filter": self.profanity_filter_var.get(),
            "alternatives": self.alternatives_var.get()
        }
        
        # Add redact if specified
        if self.redact_var.get().strip():
            options["redact"] = self.redact_var.get().strip()
            
        return options
    
    def get_openai_options(self):
        """Get current OpenAI options as dictionary"""
        return {
            "model": self.openai_model_var.get(),
            "temperature": float(self.temperature_var.get()),
            "max_retries": int(self.max_retries_var.get()),
            "format_output": self.format_output_var.get(),
            "extract_speakers": self.extract_speakers_var.get(),
            "extract_topics": self.extract_topics_var.get(),
            "clean_filler_words": self.clean_filler_words_var.get()
        }

    def transcribe_audio(self):
        """Transcribe the selected audio file using Deepgram API"""
        if not self.selected_file:
            messagebox.showerror("Error", "Please select an audio file first")
            return
            
        deepgram_key = self.deepgram_api_key_var.get()
        if not deepgram_key:
            messagebox.showerror("Error", "Please enter your Deepgram API key")
            return
            
        self.log("Starting transcription...")
        self.update_status("Transcribing audio...")
        self.progress["value"] = 0
        self.progress_value.config(text="0%")
        self.root.update_idletasks()
        
        # Start transcription in a separate thread to keep UI responsive
        threading.Thread(target=self._transcribe_audio_thread, daemon=True).start()
    
    def _transcribe_audio_thread(self):
        """Thread function to handle transcription"""
        try:
            # Get the options
            options = self.get_deepgram_options()
            
            # Update UI
            self.progress["value"] = 10
            self.progress_value.config(text="10%")
            
            # Call the transcribe module
            self.transcription_result = transcribe_audio_with_deepgram(
                self.selected_file, 
                self.deepgram_api_key_var.get(),
                options
            )
            
            # Update progress
            self.progress["value"] = 100
            self.progress_value.config(text="100%")
            
            # Extract transcript text
            transcript = self.transcription_result.get('results', {}).get('channels', [{}])[0].get('alternatives', [{}])[0].get('transcript', '')
            
            if transcript:
                # Log success
                self.log("Transcription successful!")
                preview = transcript[:100] + "..." if len(transcript) > 100 else transcript
                self.log(f"Transcript preview: {preview}")
                
                # Get metadata
                duration = self.transcription_result.get('metadata', {}).get('duration')
                if duration:
                    duration_str = f"{duration:.2f} seconds"
                    self.log(f"Audio duration: {duration_str}")
                
                confidence = self.transcription_result.get('results', {}).get('channels', [{}])[0].get('alternatives', [{}])[0].get('confidence', 0)
                if confidence:
                    confidence_str = f"{confidence:.2%}"
                    self.log(f"Confidence score: {confidence_str}")
                
                # Save raw transcript
                self.save_raw_transcript()
                
                # Update status
                self.update_status("Transcription complete")
            else:
                self.log("No transcript found in results")
                self.update_status("Transcription yielded no results")
                
        except Exception as e:
            error_msg = f"Error during transcription: {str(e)}"
            self.log(error_msg)
            messagebox.showerror("Error", error_msg)
            self.update_status("Transcription failed")
            
            # Reset progress on error
            self.progress["value"] = 0
            self.progress_value.config(text="0%")

    def correct_transcript(self):
        """Correct transcript using OpenAI API"""
        if not self.transcription_result:
            messagebox.showerror("Error", "Please transcribe audio first")
            return
            
        openai_key = self.openai_api_key_var.get()
        if not openai_key:
            messagebox.showerror("Error", "Please enter your OpenAI API key")
            return
            
        transcript = self.transcription_result.get('results', {}).get('channels', [{}])[0].get('alternatives', [{}])[0].get('transcript', '')
        if not transcript:
            messagebox.showerror("Error", "No transcript found in results")
            return
            
        self.log("Starting transcript correction with OpenAI...")
        self.update_status("Correcting transcript...")
        self.progress["value"] = 0
        self.progress_value.config(text="0%")
        
        # Start correction in a separate thread
        threading.Thread(target=self._correct_transcript_thread, args=(transcript,), daemon=True).start()
    
    def _correct_transcript_thread(self, transcript):
        """Thread function to handle transcript correction"""
        try:
            # Update progress
            self.progress["value"] = 20
            self.progress_value.config(text="20%")
            
            # Get OpenAI options
            options = self.get_openai_options()
            
            # Call the correction module
            self.corrected_result = correct_transcript_with_openai(
                transcript,
                self.openai_api_key_var.get(),
                options
            )
            
            # Update progress
            self.progress["value"] = 100
            self.progress_value.config(text="100%")
            
            self.log("Transcript correction complete!")
            preview = self.corrected_result['corrected_transcript'][:100] + "..." if len(self.corrected_result['corrected_transcript']) > 100 else self.corrected_result['corrected_transcript']
            self.log(f"Corrected transcript preview: {preview}")
            
            # Check if topics were extracted
            if 'topics' in self.corrected_result:
                topics = ", ".join(self.corrected_result['topics'])
                self.log(f"Extracted topics: {topics}")
            
            # Save corrected transcript
            self.save_corrected_transcript()
            
            # Update status
            self.update_status("Transcript correction complete")
            
        except TranscriptionCorrectionError as e:
            error_msg = f"Error during correction: {str(e)}"
            self.log(error_msg)
            messagebox.showerror("Error", error_msg)
            self.update_status("Transcript correction failed")
            
        except Exception as e:
            error_msg = f"Error during transcript correction: {str(e)}"
            self.log(error_msg)
            messagebox.showerror("Error", error_msg)
            self.update_status("Transcript correction failed")
            
        finally:
            # Reset progress on completion or error
            if self.progress["value"] != 100:
                self.progress["value"] = 0
                self.progress_value.config(text="0%")

    def save_raw_transcript(self):
        """Save raw transcript to file"""
        if not self.transcription_result:
            return False
            
        try:
            # Generate filename based on original audio file
            base_filename = os.path.splitext(os.path.basename(self.selected_file))[0]
            
            # Save JSON result
            json_output_path = os.path.join("transcripts", f"{base_filename}_raw_transcript.json")
            with open(json_output_path, 'w') as f:
                json.dump(self.transcription_result, f, indent=2)
                
            # Save plain text transcript
            transcript = self.transcription_result.get('results', {}).get('channels', [{}])[0].get('alternatives', [{}])[0].get('transcript', '')
            
            text_output_path = os.path.join("transcripts", f"{base_filename}_raw_transcript.txt")
            with open(text_output_path, 'w') as f:
                f.write(transcript)
                
            self.log(f"Raw transcript saved to: {json_output_path}")
            self.log(f"Raw transcript text saved to: {text_output_path}")
            return True
            
        except Exception as e:
            self.log(f"Error saving raw transcript: {str(e)}")
            return False

    def save_corrected_transcript(self):
        """Save corrected transcript to file"""
        if not self.corrected_result:
            return False
            
        try:
            # Generate filename based on original audio file
            base_filename = os.path.splitext(os.path.basename(self.selected_file))[0]
            
            # Save JSON result
            json_output_path = os.path.join("corrected_transcripts", f"{base_filename}_corrected_transcript.json")
            with open(json_output_path, 'w') as f:
                json.dump(self.corrected_result, f, indent=2)
                
            # Save plain text
            text_output_path = os.path.join("corrected_transcripts", f"{base_filename}_corrected_transcript.txt")
            with open(text_output_path, 'w') as f:
                f.write(self.corrected_result["corrected_transcript"])
                
            self.log(f"Corrected transcript saved to: {text_output_path}")
            return True
            
        except Exception as e:
            self.log(f"Error saving corrected transcript: {str(e)}")
            return False

    def save_results(self):
        """Save both raw and corrected transcripts"""
        if not self.transcription_result:
            messagebox.showerror("Error", "Nothing to save. Please transcribe audio first.")
            return
            
        # Save raw transcript
        raw_saved = self.save_raw_transcript()
        
        # Save corrected transcript if available
        corrected_saved = False
        if self.corrected_result:
            corrected_saved = self.save_corrected_transcript()
            
        if raw_saved or corrected_saved:
            messagebox.showinfo(
                "Files Saved", 
                "Files have been saved to the transcripts and/or corrected_transcripts directories."
            )
            self.update_status("Results saved successfully")
    
    def preview_results(self):
        """Preview results in a new window"""
        if not self.transcription_result:
            messagebox.showerror("Error", "No transcription results to preview")
            return
        
        # Create new window
        preview_window = tk.Toplevel(self.root)
        preview_window.title("Transcription Results Preview")
        preview_window.geometry("800x600")
        
        # Create notebook for tabs
        preview_notebook = ttk.Notebook(preview_window)
        preview_notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Raw transcript tab
        raw_tab = ttk.Frame(preview_notebook, padding=10)
        preview_notebook.add(raw_tab, text="Raw Transcript")
        
        raw_transcript = self.transcription_result.get('results', {}).get('channels', [{}])[0].get('alternatives', [{}])[0].get('transcript', 'No transcript available')
        
        raw_text = ScrolledText(raw_tab)
        raw_text.pack(fill=tk.BOTH, expand=True)
        raw_text.insert(tk.END, raw_transcript)
        raw_text.config(state=tk.DISABLED)
        
        # Corrected transcript tab (if available)
        if self.corrected_result:
            corrected_tab = ttk.Frame(preview_notebook, padding=10)
            preview_notebook.add(corrected_tab, text="Corrected Transcript")
            
            corrected_text = ScrolledText(corrected_tab)
            corrected_text.pack(fill=tk.BOTH, expand=True)
            corrected_text.insert(tk.END, self.corrected_result['corrected_transcript'])
            corrected_text.config(state=tk.DISABLED)
            
            # Select the corrected tab by default
            preview_notebook.select(1)
            
            # If topics are available, add a topics tab
            if 'topics' in self.corrected_result:
                topics_tab = ttk.Frame(preview_notebook, padding=10)
                preview_notebook.add(topics_tab, text="Topics")
                
                topics_text = ScrolledText(topics_tab)
                topics_text.pack(fill=tk.BOTH, expand=True)
                
                topics = self.corrected_result.get('topics', [])
                topics_text.insert(tk.END, "Extracted Topics:\n\n" + "\n".join([f"• {topic}" for topic in topics]))
                topics_text.config(state=tk.DISABLED)
        
        # Metadata tab
        metadata_tab = ttk.Frame(preview_notebook, padding=10)
        preview_notebook.add(metadata_tab, text="Metadata")
        
        metadata_text = ScrolledText(metadata_tab)
        metadata_text.pack(fill=tk.BOTH, expand=True)
        
        # Extract metadata
        metadata = []
        if 'metadata' in self.transcription_result:
            duration = self.transcription_result['metadata'].get('duration', 'Unknown')
            metadata.append(f"Duration: {duration:.2f} seconds" if isinstance(duration, (int, float)) else f"Duration: {duration}")
            
            channels = self.transcription_result['metadata'].get('channels', 'Unknown')
            metadata.append(f"Audio Channels: {channels}")
            
            sample_rate = self.transcription_result['metadata'].get('sample_rate', 'Unknown')
            metadata.append(f"Sample Rate: {sample_rate} Hz")
        
        # Add model info
        model = self.transcription_result.get('models', ['Unknown'])[0] if 'models' in self.transcription_result else self.model_var.get()
        metadata.append(f"Deepgram Model: {model}")
        
        # Add confidence score
        confidence = self.transcription_result.get('results', {}).get('channels', [{}])[0].get('alternatives', [{}])[0].get('confidence', 'Unknown')
        if isinstance(confidence, (int, float)):
            metadata.append(f"Confidence Score: {confidence:.2%}")
        else:
            metadata.append(f"Confidence Score: {confidence}")
        
        # Add OpenAI model if correction was done
        if self.corrected_result:
            metadata.append(f"OpenAI Correction Model: {self.corrected_result.get('model_used', 'Unknown')}")
        
        # Add audio file info
        if self.selected_file:
            file_size = os.path.getsize(self.selected_file) / (1024 * 1024)  # MB
            metadata.append(f"File Size: {file_size:.2f} MB")
            file_name = os.path.basename(self.selected_file)
            metadata.append(f"File Name: {file_name}")
            
        metadata_text.insert(tk.END, "\n".join(metadata))
        metadata_text.config(state=tk.DISABLED)
        
        # Add buttons
        button_frame = ttk.Frame(preview_window, padding=10)
        button_frame.pack(fill=tk.X)
        
        ttk.Button(button_frame, text="Close", command=preview_window.destroy).pack(side=tk.RIGHT)
        
        # Focus the window
        preview_window.focus_set()
    
    def open_folder(self, folder_path):
        """Open the specified folder in file explorer"""
        try:
            import subprocess
            import platform
            
            if platform.system() == "Windows":
                os.startfile(folder_path)
            elif platform.system() == "Darwin":  # macOS
                subprocess.call(["open", folder_path])
            else:  # Linux
                subprocess.call(["xdg-open", folder_path])
                
        except Exception as e:
            self.log(f"Error opening folder: {str(e)}")
            messagebox.showerror("Error", f"Could not open folder: {str(e)}")
    
    def add_batch_files(self):
        """Add files to batch processing list"""
        filetypes = [
            ("Audio files", "*.mp3 *.wav *.flac *.m4a *.ogg *.aac"),
            ("All files", "*.*")
        ]
        
        filenames = filedialog.askopenfilenames(
            title="Select Audio Files for Batch Processing",
            filetypes=filetypes
        )
        
        if filenames:
            # Add files to the batch list
            for filename in filenames:
                if filename not in self.batch_files:
                    self.batch_files.append(filename)
                    self.batch_listbox.insert(tk.END, os.path.basename(filename))
            
            self.update_batch_count()
            self.batch_log(f"Added {len(filenames)} files to batch processing queue")
    
    def add_batch_folder(self):
        """Add all supported audio files from a folder"""
        folder = filedialog.askdirectory(
            title="Select Folder with Audio Files"
        )
        
        if folder:
            # Find all audio files in the folder
            audio_extensions = ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac']
            files_added = 0
            
            for ext in audio_extensions:
                for file in glob.glob(os.path.join(folder, f"*{ext}")):
                    if file not in self.batch_files:
                        self.batch_files.append(file)
                        self.batch_listbox.insert(tk.END, os.path.basename(file))
                        files_added += 1
            
            self.update_batch_count()
            self.batch_log(f"Added {files_added} audio files from folder: {folder}")
    
    def clear_batch_files(self):
        """Clear all files from batch processing list"""
        self.batch_files = []
        self.batch_listbox.delete(0, tk.END)
        self.update_batch_count()
        self.batch_log("Cleared batch processing queue")
    
    def update_batch_count(self):
        """Update the batch file count label"""
        count = len(self.batch_files)
        self.batch_count_label.config(text=f"{count} files selected")
    
    def start_batch_processing(self):
        """Start processing all files in the batch"""
        if not self.batch_files:
            messagebox.showerror("Error", "No files selected for batch processing")
            return
        
        # Verify API keys
        deepgram_key = self.deepgram_api_key_var.get()
        openai_key = self.openai_api_key_var.get()
        
        if not deepgram_key:
            messagebox.showerror("Error", "Please enter your Deepgram API key")
            return
        
        # Confirm if OpenAI correction should be performed
        do_correction = True
        if not openai_key:
            result = messagebox.askquestion("OpenAI Correction", 
                                         "OpenAI API key is missing. Do you want to proceed with transcription only?")
            if result != 'yes':
                return
            do_correction = False
        
        # Start batch processing
        self.batch_processing_active = True
        self.batch_progress["value"] = 0
        self.batch_progress_label.config(text="Starting batch processing...")
        
        # Clear previous batch logs
        self.batch_status_text.config(state=tk.NORMAL)
        self.batch_status_text.delete(1.0, tk.END)
        self.batch_status_text.config(state=tk.DISABLED)
        
        # Create batch directory with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.batch_dir = os.path.join("batch_results", f"batch_{timestamp}")
        os.makedirs(self.batch_dir, exist_ok=True)
        
        # Create subdirectories
        os.makedirs(os.path.join(self.batch_dir, "raw_transcripts"), exist_ok=True)
        if do_correction:
            os.makedirs(os.path.join(self.batch_dir, "corrected_transcripts"), exist_ok=True)
        
        self.batch_log(f"Created batch directory: {self.batch_dir}")
        self.update_status(f"Starting batch processing of {len(self.batch_files)} files")
        
        # Start batch processing in a separate thread
        threading.Thread(target=self._batch_processing_thread, args=(do_correction,), daemon=True).start()
    
    def _batch_processing_thread(self, do_correction):
        """Thread function to handle batch processing"""
        total_files = len(self.batch_files)
        processed = 0
        errors = 0
        
        try:
            # Process each file
            for i, file_path in enumerate(self.batch_files):
                if not self.batch_processing_active:
                    self.batch_log("Batch processing stopped by user")
                    break
                
                file_name = os.path.basename(file_path)
                self.batch_log(f"Processing file {i+1}/{total_files}: {file_name}")
                
                # Update progress
                progress = int((i / total_files) * 100)
                self.batch_progress["value"] = progress
                self.batch_progress_label.config(text=f"Processing file {i+1} of {total_files} ({progress}%)")
                
                try:
                    # Transcribe
                    self.batch_log(f"Transcribing: {file_name}")
                    options = self.get_deepgram_options()
                    
                    transcription_result = transcribe_audio_with_deepgram(
                        file_path,
                        self.deepgram_api_key_var.get(),
                        options
                    )
                    
                    # Extract transcript
                    transcript = transcription_result.get('results', {}).get('channels', [{}])[0].get('alternatives', [{}])[0].get('transcript', '')
                    
                    if not transcript:
                        self.batch_log(f"Warning: No transcript found for {file_name}")
                        errors += 1
                        continue
                    
                    # Save raw transcript
                    base_filename = os.path.splitext(file_name)[0]
                    
                    json_output_path = os.path.join(self.batch_dir, "raw_transcripts", f"{base_filename}_raw.json")
                    with open(json_output_path, 'w') as f:
                        json.dump(transcription_result, f, indent=2)
                    
                    text_output_path = os.path.join(self.batch_dir, "raw_transcripts", f"{base_filename}.txt")
                    with open(text_output_path, 'w') as f:
                        f.write(transcript)
                    
                    self.batch_log(f"Raw transcript saved for {file_name}")
                    
                    # Correct if requested
                    if do_correction:
                        self.batch_log(f"Correcting transcript for {file_name}")
                        options = self.get_openai_options()
                        
                        corrected_result = correct_transcript_with_openai(
                            transcript,
                            self.openai_api_key_var.get(),
                            options
                        )
                        
                        # Save corrected transcript
                        json_output_path = os.path.join(self.batch_dir, "corrected_transcripts", f"{base_filename}_corrected.json")
                        with open(json_output_path, 'w') as f:
                            json.dump(corrected_result, f, indent=2)
                        
                        text_output_path = os.path.join(self.batch_dir, "corrected_transcripts", f"{base_filename}.txt")
                        with open(text_output_path, 'w') as f:
                            f.write(corrected_result["corrected_transcript"])
                        
                        self.batch_log(f"Corrected transcript saved for {file_name}")
                    
                    processed += 1
                    
                except Exception as e:
                    errors += 1
                    error_msg = f"Error processing {file_name}: {str(e)}"
                    self.batch_log(error_msg)
            
            # Update final progress
            if self.batch_processing_active:
                self.batch_progress["value"] = 100
                self.batch_progress_label.config(text="Batch processing complete")
                self.batch_log(f"Batch processing complete. Processed: {processed}/{total_files} files. Errors: {errors}")
                
                # Create a summary file
                try:
                    summary_path = os.path.join(self.batch_dir, "batch_summary.txt")
                    with open(summary_path, 'w') as f:
                        f.write(f"Batch Processing Summary\n")
                        f.write(f"----------------------\n")
                        f.write(f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
                        f.write(f"Files Processed: {processed}/{total_files}\n")
                        f.write(f"Errors: {errors}\n")
                        f.write(f"Transcription Model: {self.model_var.get()}\n")
                        if do_correction:
                            f.write(f"Correction Model: {self.openai_model_var.get()}\n")
                    
                    self.batch_log(f"Batch summary saved to {summary_path}")
                except Exception as e:
                    self.batch_log(f"Error creating summary file: {str(e)}")
                
                # Show completion message
                messagebox.showinfo(
                    "Batch Processing Complete",
                    f"Processed {processed} of {total_files} files with {errors} errors.\nResults saved in {self.batch_dir}"
                )
        finally:
            self.batch_processing_active = False
            self.update_status("Batch processing finished")
    
    def stop_batch_processing(self):
        """Stop the current batch processing"""
        if self.batch_processing_active:
            self.batch_processing_active = False
            self.batch_log("Stopping batch processing...")
            self.batch_progress_label.config(text="Stopping...")
            self.update_status("Stopping batch processing")

def main():
    """Main entry point"""
    # Setup dependencies
    try:
        import requests
        import openai
    except ImportError:
        print("Missing required packages. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "openai", "python-dotenv"])
        import requests
        import openai
    
    # Create and run the Tkinter app
    root = tk.Tk()
    app = TranscriptionApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
