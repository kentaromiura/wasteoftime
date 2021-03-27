let EXIT_CODE = 0;
const preamble = `%include 'system.inc'
   global _start
   section .text
_start:
;   --- MAIN PROGRAM ---
`;
const epilog = `
;   --- END OF MAIN ---
   push dword ${EXIT_CODE}
   sys.exit
`;

const globalData = [];

let _id = 0;
const getNextId = () => `g_s${(_id++).toString(36)}`;

const logASM = (where, id) => `
   push dword ${globalData.find(x => x.id === id).val.length +1}
   push dword ${id}
   push dword ${where}
   sys.write
`;

const dataSection = () => `
section .data
${
   globalData.map(v => `${v.id}: db "${v.val}", 10`).join('\n')
}
`;

const handles = {
   console: {
      log: args => {
         const data = {
            id: getNextId(),
            val: args[0].value
         };
         globalData.push(data);
         return logASM('stdout', data.id);
      },
      error: args => {
         const data = {
            id: getNextId(),
            val: args[0].value
         };
         globalData.push(data);
         return logASM('stderr', data.id);
      }
   }
};

const handleCallExpression = exp => {
	const callee = exp.callee;
	if (callee.type === "MemberExpression") {
		return handles[callee.object.name][callee.property.name](exp.arguments)
	}
	return "";
}

const evaluate = body => {
   return body.map(statement => {
      if (statement.type !== 'ExpressionStatement') 
	return '';
      if (statement.expression.type === 'CallExpression') 
	return handleCallExpression(statement.expression);
      return '';
   }).join('\n');
}

export default function transformer(file, api) {
   const j = api.jscodeshift;

   return j(file.source)
      .find(j.Identifier, {name: 'main'})
      .forEach(main => {
         const asm = `${
            preamble
         }${
            evaluate(main.parent.value.body.body)
         }${
            epilog
         }${
            dataSection()
         }`;
         j(main.parent).replaceWith(asm);
      })
      .toSource();
}
