
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
import configparser
from pathlib import Path

# Import local modules
from transcribe import transcribe_audio_with_deepgram
from correct import correct_transcript_with_openai

class TranscriptionApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Local Audio Transcription Tool")
        self.root.geometry("800x600")
        
        # Create or load configuration
        self.config = configparser.ConfigParser()
        self.config_file = "config.ini"
        self.load_config()
        
        # Create directory structure
        self.create_directories()
        
        # Create main frame
        self.main_frame = ttk.Frame(self.root, padding="20")
        self.main_frame.pack(fill=tk.BOTH, expand=True)
        
        # API Keys section
        self.create_api_keys_section()
        
        # File selection
        self.create_file_selection_section()
        
        # Transcription options
        self.create_transcription_options_section()
        
        # Status and logs
        self.create_status_section()
        
        # Action buttons
        self.create_action_buttons()
        
        # Initialize variables
        self.selected_file = None
        self.transcription_result = None
        self.corrected_result = None

    def create_directories(self):
        """Create necessary directories if they don't exist"""
        os.makedirs("audio_files", exist_ok=True)
        os.makedirs("transcripts", exist_ok=True)
        os.makedirs("corrected_transcripts", exist_ok=True)

    def load_config(self):
        """Load configuration from file or create default"""
        if os.path.exists(self.config_file):
            self.config.read(self.config_file)
        
        # Ensure sections exist
        if 'API_KEYS' not in self.config:
            self.config['API_KEYS'] = {}
        if 'SETTINGS' not in self.config:
            self.config['SETTINGS'] = {}
            
        # Set defaults if not present
        if 'deepgram_api_key' not in self.config['API_KEYS']:
            self.config['API_KEYS']['deepgram_api_key'] = ''
        if 'openai_api_key' not in self.config['API_KEYS']:
            self.config['API_KEYS']['openai_api_key'] = ''

    def save_config(self):
        """Save configuration to file"""
        # Update config with current values
        self.config['API_KEYS']['deepgram_api_key'] = self.deepgram_api_key_var.get()
        self.config['API_KEYS']['openai_api_key'] = self.openai_api_key_var.get()
        
        # Write to file
        with open(self.config_file, 'w') as f:
            self.config.write(f)
        
        messagebox.showinfo("Configuration", "API keys saved successfully")

    def create_api_keys_section(self):
        """Create the API keys section of the UI"""
        keys_frame = ttk.LabelFrame(self.main_frame, text="API Keys", padding="10")
        keys_frame.pack(fill=tk.X, pady=10)
        
        # Deepgram API Key
        ttk.Label(keys_frame, text="Deepgram API Key:").grid(column=0, row=0, sticky=tk.W, pady=5)
        self.deepgram_api_key_var = tk.StringVar(value=self.config['API_KEYS']['deepgram_api_key'])
        self.deepgram_key_entry = ttk.Entry(keys_frame, width=50, show="*", textvariable=self.deepgram_api_key_var)
        self.deepgram_key_entry.grid(column=1, row=0, padx=5)
        self.deepgram_show_key = tk.BooleanVar(value=False)
        ttk.Checkbutton(keys_frame, text="Show", variable=self.deepgram_show_key, 
                        command=lambda: self.toggle_key_visibility(self.deepgram_key_entry, self.deepgram_show_key)).grid(column=2, row=0)
        
        # OpenAI API Key
        ttk.Label(keys_frame, text="OpenAI API Key:").grid(column=0, row=1, sticky=tk.W, pady=5)
        self.openai_api_key_var = tk.StringVar(value=self.config['API_KEYS']['openai_api_key'])
        self.openai_key_entry = ttk.Entry(keys_frame, width=50, show="*", textvariable=self.openai_api_key_var)
        self.openai_key_entry.grid(column=1, row=1, padx=5)
        self.openai_show_key = tk.BooleanVar(value=False)
        ttk.Checkbutton(keys_frame, text="Show", variable=self.openai_show_key, 
                         command=lambda: self.toggle_key_visibility(self.openai_key_entry, self.openai_show_key)).grid(column=2, row=1)
        
        # Save button
        ttk.Button(keys_frame, text="Save API Keys", command=self.save_config).grid(column=1, row=2, pady=10)

    def toggle_key_visibility(self, entry_widget, var):
        """Toggle showing/hiding API key"""
        if var.get():
            entry_widget.config(show="")
        else:
            entry_widget.config(show="*")

    def create_file_selection_section(self):
        """Create the file selection section"""
        file_frame = ttk.LabelFrame(self.main_frame, text="Audio File Selection", padding="10")
        file_frame.pack(fill=tk.X, pady=10)
        
        ttk.Label(file_frame, text="Selected File: None").grid(column=0, row=0, sticky=tk.W, pady=5)
        self.file_label = ttk.Label(file_frame, text="No file selected")
        self.file_label.grid(column=1, row=0, sticky=tk.W, pady=5)
        
        ttk.Button(file_frame, text="Browse Files...", command=self.select_file).grid(column=0, row=1, pady=10)
        
        # Display file info when selected
        self.file_info_label = ttk.Label(file_frame, text="")
        self.file_info_label.grid(column=0, row=2, columnspan=2, sticky=tk.W, pady=5)

    def create_transcription_options_section(self):
        """Create transcription options section"""
        options_frame = ttk.LabelFrame(self.main_frame, text="Transcription Options", padding="10")
        options_frame.pack(fill=tk.X, pady=10)
        
        # Deepgram model selection
        ttk.Label(options_frame, text="Deepgram Model:").grid(column=0, row=0, sticky=tk.W, pady=5)
        self.model_var = tk.StringVar(value="nova-2")
        models = ["nova-2", "nova", "enhanced", "base"]
        model_dropdown = ttk.Combobox(options_frame, textvariable=self.model_var, values=models, state="readonly")
        model_dropdown.grid(column=1, row=0, sticky=tk.W, pady=5, padx=5)
        
        # Feature toggles
        self.punctuate_var = tk.BooleanVar(value=True)
        self.diarize_var = tk.BooleanVar(value=False)
        self.smart_format_var = tk.BooleanVar(value=True)
        
        ttk.Checkbutton(options_frame, text="Punctuation", variable=self.punctuate_var).grid(
            column=0, row=1, sticky=tk.W, pady=2)
        ttk.Checkbutton(options_frame, text="Speaker Diarization", variable=self.diarize_var).grid(
            column=0, row=2, sticky=tk.W, pady=2)
        ttk.Checkbutton(options_frame, text="Smart Formatting", variable=self.smart_format_var).grid(
            column=1, row=1, sticky=tk.W, pady=2)

    def create_status_section(self):
        """Create status and log section"""
        status_frame = ttk.LabelFrame(self.main_frame, text="Status & Logs", padding="10")
        status_frame.pack(fill=tk.BOTH, expand=True, pady=10)
        
        # Status text widget
        self.status_text = tk.Text(status_frame, height=10, width=80, wrap=tk.WORD)
        self.status_text.pack(fill=tk.BOTH, expand=True)
        self.status_text.config(state=tk.DISABLED)
        
        # Progress bar
        self.progress = ttk.Progressbar(status_frame, orient=tk.HORIZONTAL, length=100, mode='indeterminate')
        self.progress.pack(fill=tk.X, pady=10)

    def create_action_buttons(self):
        """Create action buttons"""
        buttons_frame = ttk.Frame(self.main_frame)
        buttons_frame.pack(fill=tk.X, pady=10)
        
        ttk.Button(buttons_frame, text="Transcribe Audio", command=self.transcribe_audio).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="Correct Transcript (OpenAI)", command=self.correct_transcript).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="Save Results", command=self.save_results).pack(side=tk.LEFT, padx=5)
        ttk.Button(buttons_frame, text="Exit", command=self.root.quit).pack(side=tk.RIGHT, padx=5)

    def log(self, message):
        """Add message to status text"""
        self.status_text.config(state=tk.NORMAL)
        self.status_text.insert(tk.END, f"{message}\n")
        self.status_text.see(tk.END)
        self.status_text.config(state=tk.DISABLED)
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
        self.progress.start()
        
        try:
            # Prepare the options
            options = {
                "model": self.model_var.get(),
                "punctuate": self.punctuate_var.get(),
                "diarize": self.diarize_var.get(),
                "smart_format": self.smart_format_var.get()
            }
            
            # Call the transcribe module
            self.transcription_result = transcribe_audio_with_deepgram(
                self.selected_file, 
                deepgram_key,
                options
            )
            
            transcript = self.transcription_result.get('results', {}).get('channels', [{}])[0].get('alternatives', [{}])[0].get('transcript', '')
            
            self.log("Transcription successful!")
            self.log(f"Transcript preview: {transcript[:100]}...")
            
            # Save raw transcript
            self.save_raw_transcript()
                
        except Exception as e:
            error_msg = f"Error during transcription: {str(e)}"
            self.log(error_msg)
            messagebox.showerror("Error", error_msg)
        finally:
            self.progress.stop()

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
        self.progress.start()
        
        try:
            # Call the correction module
            self.corrected_result = correct_transcript_with_openai(
                transcript,
                openai_key
            )
            
            self.log("Transcript correction complete!")
            self.log(f"Corrected transcript preview: {self.corrected_result['corrected_transcript'][:100]}...")
            
            # Save corrected transcript
            self.save_corrected_transcript()
            
        except Exception as e:
            self.log(f"Error during transcript correction: {str(e)}")
            messagebox.showerror("Error", f"Correction failed: {str(e)}")
        finally:
            self.progress.stop()

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
            text_output_path = os.path.join("transcripts", f"{base_filename}_raw_transcript.txt")
            transcript = self.transcription_result.get('results', {}).get('channels', [{}])[0].get('alternatives', [{}])[0].get('transcript', '')
            
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

def main():
    """Main entry point"""
    # Setup dependencies
    try:
        import requests
        import openai
    except ImportError:
        print("Missing required packages. Installing...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests", "openai"])
        import requests
        import openai
    
    # Create and run the Tkinter app
    root = tk.Tk()
    app = TranscriptionApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()
