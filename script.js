function render(value) {
	const content = document.getElementById('content');
	if(typeof value === 'string') {
		content.textContent = value;
	} else {
		while(content.firstChild) {
			content.removeChild(content.firstChild);
		}
		content.appendChild(value);
	}
}

function parseNode(node, indentLevel = 0) {
	const indent = new Array(indentLevel * 4).join(' ');
	let result;
	switch(node.nodeType) {
		case Node.ELEMENT_NODE:
			result = indent + `<${node.tagName}`;

			for(const { name, value } of node.attributes) {
				result += ` ${name}=${value}`;
			}
			if(node.hasChildNodes()) {
				result += '>\n';
				if(node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE && !/^\s*$/.test(node.childNodes[0].data)) {
					result += node.childNodes[0].data;
				} else {
					for(const child of node.childNodes) {
						if(child.nodeType === Node.TEXT_NODE && /^\s*$/.test(child.data)) {
							continue;
						}
						result += parseNode(child, intentLevel + 1) + '\n';
					}
				}
				result += `</${node.tagName}>\n`;
			} else {
				result += ' />\n';
			}

			return result;

		case Node.TEXT_NODE:
			return node.data;

		case Node.CDATA_SECTION_NODE:
			return `<![CDATA[${node.data}]]>`;

	   case Node.COMMENT_NODE:
			return `<!--${node.data}-->`;

	   case Node.PROCESSING_INSTRUCTION_NODE:
			return `<?${node.target} ${node.data}?>`;

	   case Node.DOCUMENT_TYPE_NODE:
		   result = `<!DOCTYPE ${node.name}`;
		   if(node.publicId) {
			   result += ` PUBLIC "${node.publicId}"`;
		   }
		   if(node.systemId) {
			   result += ` "${node.systemId}"`;
		   }
		   result += '>'

		   return result;
		default:
			throw new Error('Wat?');
			break;
	}
}

function parse(xml, isHtml) {
	const ts = performance.now();
	const doc = new DOMParser().parseFromString(xml, isHtml ? 'text/html' : 'text/xml');

	//doc.querySelector('parsererror')?.remove();
	window.lastDocument = doc;
	let result = '';
	for(const child of doc.childNodes) {
		result += `${parseNode(child)}\n`;
	}
	const used = performance.now() - ts;
	console.log('Used', used, 'ms to create dom tree');
	return result;
}

document.getElementById('file-selector').addEventListener('change', async evt => {
	const file = evt.target.files[0];
	const isHtml = file.name.endsWith('.html') || file.name.endsWith('.htm');
	const data = await file.text();
	const parsed = parse(data, isHtml);
	render(parsed);
});

// Seed initial
fetch('doc.xml')
	.then(res => res.text())
	.then(parse)
	.then(render);
