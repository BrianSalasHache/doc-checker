import Parser from 'tree-sitter';
import Java from 'tree-sitter-java';
import JavaScript from 'tree-sitter-javascript';
import Python from 'tree-sitter-python';

const parser = new Parser();

export function parseCode(code: string, language: string) {
  switch (language) {
    case 'javascript':
    case 'typescript':
      parser.setLanguage(JavaScript);
      break;
    case 'python':
      parser.setLanguage(Python);
      break;
    case 'java':
      parser.setLanguage(Java);
      break;
  }

  return parser.parse(code);
}
