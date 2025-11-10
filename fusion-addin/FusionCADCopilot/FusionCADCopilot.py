"""
Fusion CAD Copilot - AI-powered CAD generation inside Fusion 360
Like Cursor, but for CAD.
"""

import adsk.core, adsk.fusion, traceback
import json
import urllib.request
import urllib.error

# Global variables
_app = adsk.core.Application.get()
_ui = _app.userInterface
_handlers = []
_palette = None

# Backend API configuration
BACKEND_URL = 'http://localhost:3001'  # Change if deploying

def run(context):
    """
    Called when the add-in is started (run button clicked)
    Creates the palette UI and registers event handlers
    """
    try:
        global _palette

        # Create the palette
        _palette = _ui.palettes.add(
            'FusionCADCopilot',           # ID
            'CAD Copilot',                # Name
            './resources/palette.html',   # HTML file
            True,                         # isVisible
            True,                         # showCloseButton
            True,                         # isResizable
            350,                          # width
            700                           # height
        )

        # Dock to right side (like Cursor sidebar)
        _palette.dockingState = adsk.core.PaletteDockingStates.PaletteDockStateRight

        # Register event handler for HTML -> Python communication
        onHTMLEvent = PaletteHTMLEventHandler()
        _palette.incomingFromHTML.add(onHTMLEvent)
        _handlers.append(onHTMLEvent)

        # Send initial message to palette
        _palette.sendInfoToHTML('status', 'CAD Copilot ready! 🚀')

    except:
        if _ui:
            _ui.messageBox('Failed to start CAD Copilot:\n{}'.format(traceback.format_exc()))


def stop(context):
    """
    Called when the add-in is stopped
    Cleans up the palette and event handlers
    """
    try:
        global _palette
        if _palette:
            _palette.deleteMe()
            _palette = None

        # Clean up handlers
        _handlers.clear()

    except:
        if _ui:
            _ui.messageBox('Failed to stop CAD Copilot:\n{}'.format(traceback.format_exc()))


class PaletteHTMLEventHandler(adsk.core.HTMLEventHandler):
    """
    Handles events from the HTML palette UI
    """

    def __init__(self):
        super().__init__()
        self.conversation_id = None

    def notify(self, args):
        """
        Called when HTML sends data via window.adsk.fusionSendData()
        """
        try:
            # Parse incoming data
            data = json.loads(args.data)
            action = data.get('action')
            message = data.get('message', '')

            if action == 'generate':
                # User wants to generate CAD model
                self.handle_generate(message)

            elif action == 'execute':
                # User wants to execute specific code
                code = data.get('code', '')
                self.handle_execute(code)

            elif action == 'clear':
                # Clear conversation
                self.conversation_id = None
                _palette.sendInfoToHTML('status', 'Conversation cleared')

            else:
                _palette.sendInfoToHTML('error', f'Unknown action: {action}')

        except Exception as e:
            error_msg = f'Error in handler: {str(e)}\n{traceback.format_exc()}'
            _palette.sendInfoToHTML('error', error_msg)
            _ui.messageBox(error_msg)

    def handle_generate(self, prompt):
        """
        Call backend API to generate Fusion 360 code from natural language
        """
        try:
            # Show loading state
            self.send_to_palette('loading', 'Generating code...')

            # Prepare request
            request_data = {
                'prompt': prompt,
                'conversationId': self.conversation_id
            }

            # Call backend API
            url = f'{BACKEND_URL}/api/fusion/generate'
            req = urllib.request.Request(
                url,
                data=json.dumps(request_data).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            )

            # Get response
            response = urllib.request.urlopen(req, timeout=30)
            result = json.loads(response.read().decode('utf-8'))

            # Extract code and conversation ID
            code = result.get('code', '')
            self.conversation_id = result.get('conversationId')

            # Send code to UI for display
            self.send_to_palette('code', code)

            # Auto-execute the code
            success, message = self.execute_code(code)

            if success:
                self.send_to_palette('success', message)
            else:
                self.send_to_palette('error', f'Execution failed: {message}')

        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8') if e.fp else str(e)
            self.send_to_palette('error', f'Backend error: {e.code} - {error_body}')

        except urllib.error.URLError as e:
            self.send_to_palette('error', f'Cannot connect to backend. Is it running on {BACKEND_URL}? Error: {str(e)}')

        except Exception as e:
            error_msg = f'Error generating code: {str(e)}\n{traceback.format_exc()}'
            self.send_to_palette('error', error_msg)

    def send_to_palette(self, action, data):
        """Helper to send properly formatted messages to palette"""
        try:
            if _palette:
                message = json.dumps({'action': action, 'data': data})
                _palette.sendInfoToHTML('message', message)
        except:
            pass

    def handle_execute(self, code):
        """
        Execute user-provided code (when they edit and re-run)
        """
        try:
            self.send_to_palette('loading', 'Executing code...')

            success, message = self.execute_code(code)

            if success:
                self.send_to_palette('success', message)
            else:
                self.send_to_palette('error', f'Execution failed: {message}')

        except Exception as e:
            error_msg = f'Error executing code: {str(e)}'
            self.send_to_palette('error', error_msg)

    def execute_code(self, code):
        """
        Safely execute generated Fusion 360 Python code
        Returns: (success: bool, message: str)
        """
        try:
            # Validate code is not empty
            if not code or not code.strip():
                return False, "No code to execute"

            # Create namespace with Fusion API access
            namespace = {
                'adsk': adsk,
                'app': _app,
                'ui': _ui,
                '__builtins__': __builtins__
            }

            # Execute the code
            exec(code, namespace)

            # Success!
            return True, "✅ Model generated successfully!"

        except SyntaxError as e:
            return False, f"Syntax error in generated code: {str(e)}\nLine {e.lineno}"

        except Exception as e:
            return False, f"{str(e)}\n{traceback.format_exc()}"
