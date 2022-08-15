function render(value) {
	const content = document.getElementById('content');
	if (typeof value === 'string') {
		content.textContent = value;
	} else {
		while (content.firstChild) {
			content.removeChild(content.firstChild);
		}
		content.appendChild(value);
	}
}

function parseNode(node, indentLevel = 0) {
	const indent = new Array(indentLevel * 4).join(' ');
	let result;
	switch (node.nodeType) {
		case Node.ELEMENT_NODE:
			result = indent + `<${node.tagName}`;

			for (const { name, value } of node.attributes) {
				result += ` ${name}=${value}`;
			}
			if (node.hasChildNodes()) {
				result += '>\n';
				for (const child of node.childNodes) {
					if (child.nodeType === Node.TEXT_NODE && /^[\n\r\t ]*$/.test(child.data)) {
						continue;
					}
					result += parseNode(child, indentLevel + 1);
				}
				result += `${indent}</${node.tagName}>\n`;
			} else {
				result += ' />\n';
			}

			return result;

		case Node.TEXT_NODE:
			return node.data.trim().split('\n').map(val => indent + val.trim()).join('\n') + '\n';

		case Node.CDATA_SECTION_NODE:
			if (/\n/.test(node.data)) {
				return `${indent}<![CDATA[\n${node.data.trim().split('\n').map(val => indent + val.trim()).join('\n')}\n${indent}]]>\n`;
			}
			return `${indent}<![CDATA[${node.data.trim()}]]>`;

		case Node.COMMENT_NODE:
			if (/\n/.test(node.data)) {
				return `${indent}<!--\n${node.data.trim().split('\n').map(val => indent + val.trim()).join('\n')}\n${indent}-->\n`;
			}
			return `${indent}<!-- ${node.data.trim()} -->\n`

		case Node.PROCESSING_INSTRUCTION_NODE:
			return `${indent}<?${node.target} ${node.data}?>\n`;

		case Node.DOCUMENT_TYPE_NODE:
			result = `${indent}<!DOCTYPE ${node.name}`;
			if (node.publicId) {
				result += ` PUBLIC "${node.publicId}"`;
			}
			if (node.systemId) {
				result += ` "${node.systemId}"`;
			}
			result += '>\n';

			return result;
		default:
			throw new Error('Wat?');
	}
}

function parse(xml, isHtml) {
	const ts = performance.now();
	const doc = new DOMParser().parseFromString(xml, isHtml ? 'text/html' : 'text/xml');

	//doc.querySelector('parsererror')?.remove();
	window.lastDocument = doc;
	let result = '';
	for (const child of doc.childNodes) {
		result += `${parseNode(child)}`;
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
