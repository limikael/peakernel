export function escapeCString(str) {
    return str
        .replace(/\\/g, '\\\\')   // backslash
        .replace(/"/g, '\\"')     // double quote
        .replace(/\n/g, '\\n')    // newline
        .replace(/\r/g, '\\r')    // carriage return
        .replace(/\t/g, '\\t');   // tab
}

function countLeadingWhitespace(str) {
    let i=0;
    while (i < str.length && (str[i] === ' ' || str[i] === '\t'))
        i++;

    return i;
}

export function unindent(s) {
    let lines=s.split("\n");
    lines=lines.filter(l=>l.trim());
    let leadingWhiteSpace=countLeadingWhitespace(lines[0]);
    lines=lines.map(l=>l.slice(leadingWhiteSpace));
    return lines.join("\n")+"\n";
}

export function autoIndent(text, indentSize=4) {
    const lines = text.split('\n');
    let result = [];
    let indentLevel = 0;

    for (let line of lines) {
        // Strip whitespace from the line
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (trimmedLine === '') {
            continue;
        }
        
        // Decrease indent level if line starts with '}'
        if (trimmedLine.startsWith('}')) {
            indentLevel = Math.max(0, indentLevel - 1);
        }
        
        // Add indentation
        const indentation = ' '.repeat(indentLevel * indentSize);
        result.push(indentation + trimmedLine);
        
        // Increase indent level if line ends with '{'
        if (trimmedLine.endsWith('{')) {
            indentLevel++;
        }
    }
    
    return result.join('\n')+"\n";
}

export function createIniContent(sections) {
    function generateItem(name, value) {
        if (Array.isArray(value))
            return `${name}=\n${value.map(v=>`  ${v}`).join("\n")}\n`;

        return `${name}=${value}\n`;
    }

    function generateSection(name, items) {
        let content=`[${name}]\n`;
        for (let itemName in items)
            content+=generateItem(itemName,items[itemName]);

        return content;
    }

    let content="";
    for (let name in sections)
        content+=generateSection(name,sections[name]);

    return content;
}
