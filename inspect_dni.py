import urllib.request
from html.parser import HTMLParser

class FormParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_form = False
        self.forms = []
        self.current_form = {}

    def handle_starttag(self, tag, attrs):
        if tag == 'form':
            self.in_form = True
            self.current_form = {'action': '', 'method': '', 'inputs': []}
            for attr in attrs:
                if attr[0] == 'action':
                    self.current_form['action'] = attr[1]
                if attr[0] == 'method':
                    self.current_form['method'] = attr[1]
        elif self.in_form and tag == 'input':
            inp = {}
            for attr in attrs:
                inp[attr[0]] = attr[1]
            self.current_form['inputs'].append(inp)
        elif self.in_form and tag == 'button':
            btn = {}
            for attr in attrs:
                btn[attr[0]] = attr[1]
            self.current_form['inputs'].append({'type': 'button', **btn})

    def handle_endtag(self, tag):
        if tag == 'form':
            self.in_form = False
            self.forms.append(self.current_form)
            self.current_form = {}

def inspect_url(url):
    print(f"Inspecting {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            html = response.read().decode('utf-8')
            parser = FormParser()
            parser.feed(html)
            for i, f in enumerate(parser.forms):
                print(f"Form {i+1}: action={f['action']}, method={f.get('method', 'GET')}")
                for inp in f['inputs']:
                    print(f"  Input: name={inp.get('name')}, type={inp.get('type')}, value={inp.get('value')}")
            
            # also look for fetch/XMLHttpRequest
            import re
            fetches = re.findall(r'fetch\([\'"]([^\'"]+)[\'"]', html)
            if fetches:
                print("Fetches found:", fetches)
            ajax = re.findall(r'url:\s*[\'"]([^\'"]+)[\'"]', html)
            if ajax:
                print("AJAX URLs found:", ajax)

    except Exception as e:
        print(f"Error: {e}")

inspect_url("https://eldni.com/pe/buscar-datos-por-dni")
inspect_url("https://dniperu.com/buscar-dni-nombres-apellidos/")
