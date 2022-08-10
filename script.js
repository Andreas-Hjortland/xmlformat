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

function parseNode(node) {
	switch(node.nodeType) {
		case Node.ELEMENT_NODE:
			const elementNode = document.createElement('div');
			elementNode.className = 'element';

			const tagElt = document.createElement('span');
			tagElt.className = 'tag';
			tagElt.appendChild(document.createTextNode(`<${node.tagName}`));
			elementNode.appendChild(tagElt);

			for(const { name, value } of node.attributes) {
				tagElt.appendChild(document.createTextNode(' '));
				const attrElement = document.createElement('span');
				attrElement.className = 'attribute';

				const attrNameElement = document.createElement('span');
				attrNameElement.className = 'attribute-name';
				attrNameElement.textContent = name;
				attrElement.appendChild(attrNameElement);

				attrElement.appendChild(document.createTextNode('="'));

				const attrValueElement = document.createElement('span');
				attrValueElement.className = 'attribute-value';
				attrValueElement.textContent = value;
				attrElement.appendChild(attrValueElement);
				attrElement.appendChild(document.createTextNode('"'));

				tagElt.appendChild(attrElement);
			}
			if(node.hasChildNodes()) {
				tagElt.appendChild(document.createTextNode('>'));
				if(node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE && !/^\s*$/.test(node.childNodes[0].data)) {
					elementNode.appendChild(parseNode(node.childNodes[0]));
				} else {
					const childNode = document.createElement('div');
					childNode.className = 'child';
					elementNode.appendChild(childNode);
					for(const child of node.childNodes) {
						if(child.nodeType === Node.TEXT_NODE && /^\s*$/.test(child.data)) {
							continue;
						}
						childNode.appendChild(parseNode(child));
					}
				}
				const endTag = document.createElement(node.childElementCount > 0 ? 'div' : 'span');
				endTag.className = 'tag';
				endTag.appendChild(document.createTextNode(`</${node.tagName}>`));
				elementNode.appendChild(endTag);
			} else {
				tagElt.appendChild(document.createTextNode(' />'));
			}

			return elementNode;

		case Node.TEXT_NODE:
			const textNode = document.createElement('span');
			textNode.className = 'text';
			textNode.textContent = node.data;
			return textNode;

		case Node.CDATA_SECTION_NODE:
			const cdataElt = document.createElement('span');
			cdataElt.className = 'cdata';
			cdataElt.appendChild(document.createTextNode('<![CDATA['));

			const cdataVal = document.createElement('span');
			cdataVal.className = 'cdata-value';
			cdataVal.textContent = node.data;
			cdataElt.appendChild(cdataVal);

			cdataElt.appendChild(document.createTextNode(']]>'));
			return cdataElt;

	   case Node.COMMENT_NODE:
			const commentElt = document.createElement('span');
			commentElt.className = 'comment';
			commentElt.appendChild(document.createTextNode(`<!--${node.data}-->`));
			return commentElt;

	   case Node.PROCESSING_INSTRUCTION_NODE:
			const processingInstructionElt = document.createElement('span');
			processingInstructionElt.className = 'comment';
			processingInstructionElt.appendChild(document.createTextNode(`<?${node.target} ${node.data}?>`));
			return processingInstructionElt;

	   case Node.DOCUMENT_TYPE_NODE:
		   const doctypeElt = document.createElement('span');
		   doctypeElt.className = 'doctype';
		   let doctypeStr = `<!DOCTYPE ${node.name}`;
		   if(node.publicId) {
			   doctypeStr += ` PUBLIC "${node.publicId}"`;
		   }
		   if(node.systemId) {
			   doctypeStr += ` "${node.systemId}"`;
		   }
		   doctypeStr += '>'

		   doctypeElt.textContent = doctypeStr;

		   return doctypeElt;
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
	const result = document.createDocumentFragment();
	let first = true;
	for(const child of doc.childNodes) {
		if(!first) {
			result.appendChild(document.createTextNode('\n'));
		}
		first = false;
		result.appendChild(parseNode(child));
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
