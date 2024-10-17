import Parser from 'tree-sitter';
// import Go from 'tree-sitter-go';
// import Java from 'tree-sitter-java';
import JavaScript from 'tree-sitter-javascript';
import Python from 'tree-sitter-python';
// import Ruby from 'tree-sitter-ruby';
// import TypeScript from 'tree-sitter-typescript';

const parser = new Parser();

export function parseCode(code: string, language: string) {
  switch (language) {
    case 'javascript':
      parser.setLanguage(JavaScript);
      break;
    case 'python':
      parser.setLanguage(Python);
      break;
    // case 'typescript':
    //   parser.setLanguage(TypeScript);
    //   break;
    // case 'go':
    //   parser.setLanguage(Go);
    //   break;
    // case 'java':
    //   parser.setLanguage(Java);
    //   break;
    // case 'ruby':
    //   parser.setLanguage(Ruby);
    //   break;
  }

  return parser.parse(code);
}
