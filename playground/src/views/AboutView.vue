<template>
  <div class="about">
    <h1>ParL VM Specification</h1>

    <h2>State</h2>

    <p>The state of the ParL VM consists of the following:</p>
    <ul>
      <li>A work stack used in any computation.</li>
      <li>A program counter which tracks the current program location.</li>
      <li>A frame stack which is used to manage scopes.</li>
      <li>A graphical display with a fixed width and height.</li>
      <li>A log used for output.</li>
      <li>A return pointer stack which stores program counters for returning from a function.</li>
    </ul>

    <p>
      The work stack is used as a &quot;scratch space&quot; when computing values. It can only be
      accessed as a stack; in particular a program cannot see beyond the topmost element without
      first popping it off the stack.
    </p>

    <p>
      The frame stack consists of frames. Each frame is a resizable array of memory locations. The
      <span class="code">i</span>th memory location within frame <span class="code">f</span> can be
      denoted as <span class="code">[i:f]</span>. <span class="code">[i]</span> can be used as
      shorthand for <span class="code">[i:0]</span>. This notation is used in ParL assembly language
      and in the rest of this document. Note that <span class="code">0</span> denotes the topmost
      frame in the frame stack, and that new frames are pushed onto the top of the stack.
    </p>

    <p>
      A program can use a <span class="code">push [i:f]</span> instruction to load a value from a
      memory location in any frame in the stack.
    </p>

    <p>
      New frames are created by the <span class="code">call</span> or
      <span class="code">oframe</span> opcodes. New frames will be pushed onto the top of the frame
      stack.
    </p>

    <p>
      Frames are meant to correspond to scopes; a high level language compiler might generate code
      that creates new frames when entering control blocks such as an
      <span class="code">if</span> or <span class="code">for</span> statement.
    </p>

    <p>The top frame can be resized using the <span class="code">alloc</span> opcode.</p>

    <p>
      Frames can be popped off the frame stack and destroyed using the
      <span class="code">cframe</span> opcode.
    </p>

    <p>
      The display is used to output graphics. The <span class="code">read</span> opcode can be used
      to read a pixel on the display. The <span class="code">write</span> and
      <span class="code">writebox</span> opcodes can be used to colour pixels on the display. It is
      assumed that the display's width and height do not change during execution of a program.
    </p>

    <h2>Function Calls and Returns</h2>

    <p>
      Whenever a <span class="code">call</span> opcode is encountered, a function name is popped off
      the work stack. The location of the start of the function is looked up in a table. The value
      of the program counter+1 is pushed onto the return pointer stack, and then the program counter
      is set to the start of the called function.
    </p>

    <p>
      A number indicating the argument count is then popped off the work stack, and that number of
      items are popped off the work stack and placed in order in a newly allocated frame that is
      pushed onto the frame stack.
    </p>

    <p>
      Function returns are implemented by a <span class="code">ret</span> instruction which pops the
      topmost item off the return pointer stack and sets the program counter to it.
    </p>

    <p>
      Note that <span class="code">ret</span> will not destroy the frame allocated by
      <span class="code">call</span>; this must be done by a seperate
      <span class="code">cframe</span> instruction. The reason is that
      <span class="code">ret</span> may be executed in an arbitrarily nested scope (the depth of
      frames allocated within a function can be arbitrarily large), and hence any
      <span class="code">ret</span> instruction will require a number of
      <span class="code">cframe</span> instructions before it anyways.
    </p>

    <h2>Data types</h2>

    <p>Each item in the work or frame stack has one of the following two types:</p>
    <ul>
      <li>An IEEE754 floating point number.</li>
      <li>
        A reference to a function (encoded as a function label, e.g.
        <span class="code">.main</span>)
      </li>
    </ul>

    <p>
      Both the work stack and the frame stack are untyped, meaning any location within them can
      contain a value of any type. Each opcode requires the items it pops from the work stack to
      have a certain type -- other constraints may also need to be satisfied -- if one of these
      expectations is violated, the VM will crash (throw an Error). The expected types (and
      constraints) for each opcode are tabulated below.
    </p>

    <p>
      A compiler can encode booleans as numbers. The logical opcodes treat any non-zero number as
      true and zero as false.
    </p>

    <h2>Initial State</h2>

    <p>
      The VM is initialized with an empty work stack and a frame stack containing a single empty
      frame.
    </p>

    <p>
      The return pointer stack is initially empty, while the program counter has an initial value of
      <span class="code">0</span>
    </p>

    <h2>Opcodes</h2>

    <p>The following is a comprehensize list of opcodes which are supported by the ParL VM:</p>

    <table>
      <thead>
        <tr>
          <th>Opcode</th>
          <th>Work Stack Before</th>
          <th>Work Stack After</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="code">add</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a + b ..</span></td>
          <td>
            Pops two numbers off the work stack, and adds them together, pushing the result onto the
            work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">sub</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a - b ..</span></td>
          <td>
            Pops two numbers off the work stack, and subtracts them, pushing the result onto the
            work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">mul</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a * b ..</span></td>
          <td>
            Pops two numbers off the work stack, and multiplies them, pushing the result onto the
            work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">div</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a / b ..</span></td>
          <td>
            Pops two numbers off the work stack, and divides them, pushing the result onto the work
            stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">mod</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a % b ..</span></td>
          <td>
            Pops two numbers off the work stack, and computes <span class="code">a % b</span>,
            pushing the result onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">inc</span></td>
          <td><span class="code">a ..</span></td>
          <td><span class="code">a + 1 ..</span></td>
          <td>
            Pops a number off the work stack, and increments it, pushing the result onto the work
            stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">dec</span></td>
          <td><span class="code">a ..</span></td>
          <td><span class="code">a - 1 ..</span></td>
          <td>
            Pops a number off the work stack, and decrements it, pushing the result onto the work
            stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">or</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a &#8744; b ..</span></td>
          <td>
            Pops two numbers off the work stack, computes their logical or (maximum) and pushes the
            result onto the work stack. Equivalent to <span class="code">max</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">and</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a &#8743; b ..</span></td>
          <td>
            Pops two numbers off the work stack, computes their logical and (minimum) and pushes the
            result onto the work stack. Equivalent to <span class="code">min</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">min</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">min(a,b) ..</span></td>
          <td>
            Pops two numbers off the work stack, computes their minimum and pushes the result onto
            the work stack. Equivalent to <span class="code">and</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">max</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">max(a,b) ..</span></td>
          <td>
            Pops two numbers off the work stack, computes their maximum and pushes the result onto
            the work stack. Equivalent to <span class="code">or</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">round</span></td>
          <td><span class="code">a ..</span></td>
          <td><span class="code">round(a) ..</span></td>
          <td>
            Pops a number off the work stack, rounds it to the nearest whole number, and pushes the
            result onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">irnd</span></td>
          <td><span class="code">a ..</span></td>
          <td><span class="code">rand(0,a) ..</span></td>
          <td>
            Pops a number off the work stack, and pushes a random whole number between 0 and that
            number (exclusive) onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">not</span></td>
          <td><span class="code">a ..</span></td>
          <td><span class="code">&#172;a ..</span></td>
          <td>
            Pops a number off the work stack, and pushes its logical negation onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">lt</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a &lt; b ..</span></td>
          <td>
            Pops two numbers <span class="code">a, b</span> off the work stack, compares them, and
            pushes <span class="code">a &lt; b</span> onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">le</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a &lt;= b ..</span></td>
          <td>
            Pops two numbers <span class="code">a, b</span> off the work stack, compares them, and
            pushes <span class="code">a &lt;= b</span> onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">eq</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a == b ..</span></td>
          <td>
            Pops two items <span class="code">a, b</span> (must be of the same type) off the work
            stack, compares them, and pushes <span class="code">a == b</span> onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">neq</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a != b ..</span></td>
          <td>
            Pops two items <span class="code">a, b</span> (must be of the same type) off the work
            stack, compares them, and pushes <span class="code">a != b</span> onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">gt</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a &gt; b ..</span></td>
          <td>
            Pops two numbers <span class="code">a, b</span> off the work stack, compares them, and
            pushes <span class="code">a &gt; b</span> onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">ge</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a &gt;= b ..</span></td>
          <td>
            Pops two numbers <span class="code">a, b</span> off the work stack, compares them, and
            pushes <span class="code">a &gt;= b</span> onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">dup</span></td>
          <td><span class="code">a ..</span></td>
          <td><span class="code">a a ..</span></td>
          <td>Pops an item off the work stack, and pushes two copies of it onto the work stack.</td>
        </tr>
        <tr>
          <td><span class="code">drop</span></td>
          <td><span class="code">a ..</span></td>
          <td><span class="code">..</span></td>
          <td>Pops an item off the work stack, and discards it.</td>
        </tr>
        <tr>
          <td><span class="code">push x</span></td>
          <td><span class="code">..</span></td>
          <td><span class="code">x ..</span></td>
          <td>
            One of just two opcodes that takes an argument. The argument is pushed onto the stack.
            Arguments can be:
            <ul>
              <li>IEEE754 floating point numbers.</li>
              <li>
                A colour (encoded as a hex string, e.g. <span class="code">#7f5612</span>). This is
                converted into a floating point number before pushing it onto the work stack.
              </li>
              <li>
                A reference to a function (encoded as a function label, e.g.
                <span class="code">.main</span>)
              </li>
              <li>
                A PC relative offset (e.g. <span class="code">#PC+9</span>). When this is given as
                the operand to <span class="code">push</span>, the current value of the program
                counter is added to the specified offset, and the resulting number is pushed onto
                the work stack.
              </li>
              <li>
                A memory location of the form <span class="code">[i:f]</span>. This will push onto
                the work stack the element at the <span class="code">i</span>th position within the
                <span class="code">f</span>th frame in the frame stack. Note that frame
                <span class="code">0</span> is the frame at the top of the stack.
              </li>
              <li>
                A memory location of the form <span class="code">[i]</span>. This is equivalent to
                <span class="code">[i:0]</span>.
              </li>
            </ul>
          </td>
        </tr>
        <tr>
          <td><span class="code">push +[i:f]</span></td>
          <td><span class="code">o ..</span></td>
          <td><span class="code">x ..</span></td>
          <td>
            Pops a number <span class="code">o</span> from the work stack and pushes the value at
            the <span class="code">i + o</span>th location in the <span class="code">f</span>th
            frame onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">nop</span></td>
          <td>N/A</td>
          <td>N/A</td>
          <td>Does nothing.</td>
        </tr>
        <tr>
          <td><span class="code">jmp</span></td>
          <td><span class="code">a ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops a number off the work stack, and sets the value of the program counter to that
            number.
          </td>
        </tr>
        <tr>
          <td><span class="code">cjmp</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops two numbers <span class="code">a, b</span> off the work stack, and sets the program
            counter to <span class="code">a</span> if <span class="code">b</span> is not equal to
            zero.
          </td>
        </tr>
        <tr>
          <td><span class="code">cjmp2</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops two numbers <span class="code">a, b</span> off the work stack, and sets the program
            counter to <span class="code">a</span> if <span class="code">b</span> is equal to zero.
          </td>
        </tr>
        <tr>
          <td><span class="code">call</span></td>
          <td><span class="code">f n a1 .. an ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops a function label <span class="code">f</span> and a number
            <span class="code">n</span> off the work stack. The VM then pops
            <span class="code">n</span> items off the work stack, creates a new frame containing
            them (preserving their order), and pushes it onto the frame stack. It then pushes the
            program counter+1 onto the return pointer stack and sets the value of the program
            counter to the location of the start of <span class="code">f</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">ret</span></td>
          <td><span class="code">..</span></td>
          <td><span class="code">..</span></td>
          <td>Pops one item from the return pointer stack, and sets the program counter to it.</td>
        </tr>
        <tr>
          <td><span class="code">halt</span></td>
          <td><span class="code">..</span></td>
          <td><span class="code">..</span></td>
          <td>Halts the ParL VM. No more instructions will be executed.</td>
        </tr>
        <tr>
          <td><span class="code">alloc</span></td>
          <td><span class="code">n ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops the number <span class="code">n</span> off the work stack and allocates
            <span class="code">n</span> new empty locations at the end of the frame at the top of
            the frame stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">oframe</span></td>
          <td><span class="code">n ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops the number <span class="code">n</span> off the work stack and creates a new frame
            with <span class="code">n</span> empty locations, pushing it onto the frame stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">cframe</span></td>
          <td><span class="code">..</span></td>
          <td><span class="code">..</span></td>
          <td>Pops a frame off the top of the frame stack, destroying it.</td>
        </tr>
        <tr>
          <td><span class="code">st</span></td>
          <td><span class="code">f i v ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops two numbers and an item off the work stack, and stores the item
            <span class="code">v</span> at <span class="code">[i:f]</span> (the
            <span class="code">i</span>th location of the <span class="code">f</span>th frame in the
            frame stack).
          </td>
        </tr>
        <tr>
          <td><span class="code">delay</span></td>
          <td><span class="code">n ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops a number <span class="code">n</span> off the work stack and sleeps for
            <span class="code">n</span> milliseconds.
          </td>
        </tr>
        <tr>
          <td><span class="code">write</span></td>
          <td><span class="code">x y c ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops three numbers <span class="code">x, y, c</span> and off the work stack and colours
            the pixel on the screen at <span class="code">x, y</span> with
            <span class="code">c</span>. <span class="code">c</span> must be a valid 8-bit color
            depth RGB colour in the range <span class="code">[0, 0xffffff]</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">writebox</span></td>
          <td><span class="code">x y w h c ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops five numbers <span class="code">x, y, w, h, c</span> off the work stack and colours
            a rectangle on the screen of width <span class="code">w</span> and height
            <span class="code">h</span> whose bottom left corner is at
            <span class="code">x, y</span> with <span class="code">c</span>.
            <span class="code">c</span> must be a valid 8-bit color depth RGB colour in the range
            <span class="code">[0, 0xffffff]</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">clear</span></td>
          <td><span class="code">c ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops a number off the work stack and colours the entire screen with it.
            <span class="code">c</span> must be a valid 8-bit color depth RGB colour in the range
            <span class="code">[0, 0xffffff]</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">read</span></td>
          <td><span class="code">x y ..</span></td>
          <td><span class="code">c ..</span></td>
          <td>
            Pops two numbers <span class="code">x, y</span> off the work stack, and pushes the
            colour of the pixel at <span class="code">x, y</span> on the screen onto the work stack.
            <span class="code">c</span> will be represented as an 8-bit color depth RGB colour in
            the range <span class="code">[0, 0xffffff]</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">width</span></td>
          <td><span class="code">..</span></td>
          <td><span class="code">w ..</span></td>
          <td>Pushes the width of the screen onto the work stack.</td>
        </tr>
        <tr>
          <td><span class="code">height</span></td>
          <td><span class="code">..</span></td>
          <td><span class="code">h ..</span></td>
          <td>Pushes the height of the screen onto the work stack.</td>
        </tr>
        <tr>
          <td><span class="code">print</span></td>
          <td><span class="code">x ..</span></td>
          <td><span class="code">..</span></td>
          <td>Pops an item off the work stack and prints a representation of it to the log.</td>
        </tr>
        <tr>
          <td><span class="code">dupa</span></td>
          <td><span class="code">v c ..</span></td>
          <td><span class="code">v .. v ..</span></td>
          <td>
            Pops an item <span class="code">v</span> and a number <span class="code">c</span> off
            the work stack and duplicates <span class="code">v</span> <span class="code">c</span>
            times, pushing each copy onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">sta</span></td>
          <td><span class="code">f i c a1 .. ac ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops a frame number <span class="code">f</span>, index number
            <span class="code">i</span> and a count number <span class="code">c</span> off the work
            stack, and then for <span class="code">j</span> ranging from
            <span class="code">0</span> to <span class="code">c - 1</span>, pops an item off the
            work stack and sets memory location <span class="code">[i+j:f]</span> to it.
          </td>
        </tr>
        <tr>
          <td><span class="code">pusha [i:f]</span></td>
          <td><span class="code">o ..</span></td>
          <td><span class="code">x ..</span></td>
          <td>
            Pops a number <span class="code">o</span> off the work stack and then pushes the item at
            memory location <span class="code">[i+o:f]</span> onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">printa</span></td>
          <td><span class="code">c a1 .. ac ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops a number <span class="code">c</span> off the work stack and then pops
            <span class="code">c</span> items off the work stack, printing each one. This can be
            used to print an array.
          </td>
        </tr>
        <tr>
          <td><span class="code">reta</span></td>
          <td><span class="code">c a1 .. ac ..</span></td>
          <td><span class="code">ac .. a1 ..</span></td>
          <td>
            Pops a number <span class="code">c</span> off the work stack and then pops
            <span class="code">c</span> items off the work stack, pushing them back in reverse
            order. This can be used to return an array from a function.
          </td>
        </tr>
        <tr>
          <td><span class="code">getchar</span></td>
          <td><span class="code">..</span></td>
          <td><span class="code">c ..</span></td>
          <td>
            Gets a character from stdin and pushes its Unicode code point onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">putchar</span></td>
          <td><span class="code">c ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops floating point number <span class="code">c</span>, rounds it to the nearest whole
            number, and prints the character with that Unicode code point to the output log.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style lang="css" scoped>
.about {
  @apply p-4 max-w-prose md:max-w-screen-md lg:max-w-screen-lg mx-auto;
}

h1 {
  @apply font-extrabold text-xl text-slate-200 my-4;
}

h2 {
  @apply font-extrabold text-lg text-slate-200 my-4;
}

p {
  @apply mb-3;
}

ul {
  @apply list-disc mb-3;
}

li {
  @apply ml-6;
}

table {
  @apply table-auto;
}

th {
  @apply px-2 font-bold;
}

td {
  @apply px-2;
}

thead {
  @apply bg-slate-900;
}

tbody {
  @apply divide-y divide-slate-700;
}

.code {
  @apply font-mono text-slate-200 bg-slate-700 px-1;
}
</style>
