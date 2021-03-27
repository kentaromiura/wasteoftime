all:
	cp test.js example.asm
	./node_modules/.bin/jscodeshift --run-in-band -t transform.js example.asm
	nasm -f elf example.asm
	ld -s -o example example.o
	rm example.o
	rm example.asm
	

