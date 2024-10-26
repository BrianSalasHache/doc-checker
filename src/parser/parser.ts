import Parser from 'tree-sitter';
import Java from 'tree-sitter-java';
import JavaScript from 'tree-sitter-javascript';
import Python from 'tree-sitter-python';
// import Go from 'tree-sitter-go';
// import Ruby from 'tree-sitter-ruby';

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
    // case 'go':
    //   parser.setLanguage(Go);
    //   break;
    // case 'ruby':
    //   parser.setLanguage(Ruby);
    //   break;
  }

  return parser.parse(code);
}
