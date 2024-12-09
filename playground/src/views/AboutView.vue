<template>
  <div class="about">

    <h1>ParL VM Specification</h1>

    <h2>ParL VM State</h2>

    <p>The ParL VM state consists of the following:</p>
    <ul>
      <li>A work stack used in any computation</li>
      <li>A call stack which tracks function calls</li>
      <li>A frame stack which is used to manage scopes</li>
      <li>A graphical display with a fixed width and height</li>
      <li>A log which is used for output</li>
    </ul>

    <p>
      The work stack is used when computing values. It can only be accessed as a stack; in
      particular the program cannot see beyond the topmost element without first popping it off the
      stack.
    </p>

    <p>
      The call stack is used whenever a function call or a return needs to be executed. Each item in
      the stack consists of a local (function-specific) instruction pointer (also called program
      counter or PC), and a reference to the function itself.
    </p>

    <p>
      When a function is called, an item containing a reference to the called function is pushed to
      the stack (with the local PC initialized to 0).
    </p>

    <p>
      When a <span class="code">ret</span> opcode needs to be executed, the topmost item is simply
      popped from the call stack.
    </p>

    <p>
      It should be clear from this description that the topmost item of the call stack acts as a
      sort of global PC, as it contains the current function, as well as a local PC within that
      function. The use of a frame stack instead of a single global PC allows us to avoid needing
      some sort of
      <a href="https://en.wikipedia.org/wiki/Calling_convention" class="link-green"
        >&quot;calling convention&quot;</a
      >.
    </p>

    <p>
      The frame stack consists of frames. Each frame is a resizable array of memory locations. A
      program can use the <span class="code">push</span> opcode to load a value from a memory
      location in any frame in the stack. Without this functionality the ParL VM would not be
      Turing complete, as its memory would be limited to the work stack. (Perhaps this is not
      entirely true; since one could write a program that uses the ParL VM display as indexable
      memory.)
    </p>

    <p>
      New frames are created by the <span class="code">call</span> or
      <span class="code">oframe</span> opcodes. New frames will be pushed onto the frame stack.
    </p>

    <p>
      Frames are meant to correspond to scopes in the ParL language; the ParL compiler generates
      code that creates new frames when entering control blocks such as an
      <span class="code">if</span> or <span class="code">for</span> statement.
    </p>

    <p>The top frame can be resized using the <span class="code">alloc</span> opcode.</p>

    <p>
      Frames can be popped off the frame stack and destroyed using the
      <span class="code">ret</span> or the <span class="code">cframe</span> opcodes.
    </p>

    <p>
      The display is used to output graphics. The <span class="code">read</span> opcode can be used
      to read a ParL on the display. The <span class="code">pixel</span> and
      <span class="code">pixelr</span> opcodes can be used to colour pixels on the display. It is
      assumed that the display's width and height do not change during execution of a program.
    </p>

    <h2>Data types</h2>

    <p>Each item in the work or frame stack has one of the following types:</p>
    <ul>
      <li>An IEEE754 floating point number.</li>
      <li>A colour (encoded as a hex string, e.g. <span class="code">#7f5612</span>)</li>
      <li>
        An instruction pointer which specifies the offset of some instruction within the current
        function. When a <span class="code">push</span> instruction with a PC relative offset (e.g.
        <span class="code">#PC+9</span>) is executed, the PC relative offset is converted into an
        instruction pointer before pushing onto the work stack. This is necessary since the PC
        relative offset is specified relative to the current PC, which will change by the time we
        actually use the offset.
      </li>
      <li>
        A reference to a function (encoded as a function label, e.g.
        <span class="code">.main</span>)
      </li>
      <li>A pointer to an array of one of the above data types (or another array type)</li>
    </ul>

    <p>
      Memory locations within a frame or an array can also contain a special
      <span class="code">undefined</span> value, meaning they have not yet been initialized.
    </p>

    <p>
      Both the work stack and the frame stack are untyped, meaning any location within them can
      contain a value of any type. Each opcode requires the items it pops from the work stack to
      have a certain type; if one of these expectations is violated, the VM will crash with a type
      error. The expected types for each opcode are tabulated below.
    </p>

    <p>
      Booleans can be encoded as numbers. The logical opcodes treat any non-zero number as true and
      zero as false.
    </p>

    <h2>Initial State</h2>

    <p>
      The VM is initialized with an empty work stack and a frame stack containing a single empty
      frame. The call stack initially holds a single item referencing a special function called
      <span class="code">.main</span> which is the designated entry point for a program.
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
            Pops two numbers off the work stack, and computes <span class="code">a % b</span>, pushing 
            the result onto the work stack.
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
            result onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">and</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">a &#8743; b ..</span></td>
          <td>
            Pops two numbers off the work stack, computes their logical and (minimum) and pushes the
            result onto the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">min</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">min(a,b) ..</span></td>
          <td>
            Pops two numbers off the work stack, computes their minimum and pushes the result onto
            the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">max</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">max(a,b) ..</span></td>
          <td>
            Pops two numbers off the work stack, computes their maximum and pushes the result onto
            the work stack.
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
            Pops a number off the work stack, and pushes a random (floating point) number between 0
            and that number (exclusive) onto the work stack.
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
            Only opcode that takes an argument. The argument is pushed onto the stack. Arguments can
            be:
            <ul>
              <li>IEEE754 floating point numbers.</li>
              <li>A colour (encoded as a hex string, e.g. <span class="code">#7f5612</span>).</li>
              <li>
                A reference to a function (encoded as a function label, e.g.
                <span class="code">.main</span>)
              </li>
              <li>
                A PC relative offset (e.g. <span class="code">#PC+9</span>). This is converted into
                an instruction pointer (see above) before pushing onto the work stack.
              </li>
              <li>
                A memory location of the form <span class="code">[offset:frame]</span>. This will
                push onto the work stack the element at the <span class="code">offset</span>th
                position within the <span class="code">frame</span>th frame in the frame stack. Note
                that frame <span class="code">0</span> is the frame at the top of the stack.
              </li>
              <li>
                A memory location of the form <span class="code">[offset]</span>. This is similar to
                the above, except the frame is assumed to be <span class="code">0</span>, i.e. the
                top frame.
              </li>
            </ul>
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
            Pops an instruction pointer off the work stack, and jumps to the location specified by
            the instruction pointer.
          </td>
        </tr>
        <tr>
          <td><span class="code">cjmp</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops an instruction pointer and a number off the work stack, and jumps to the location
            specified by the instruction pointer if the number is equal to zero.
          </td>
        </tr>
        <tr>
          <td><span class="code">cjmp2</span></td>
          <td><span class="code">a b ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops an instruction pointer and a number off the work stack, and jumps to the location
            specified by the instruction pointer if the number is not equal to zero.
          </td>
        </tr>
        <tr>
          <td><span class="code">call</span></td>
          <td><span class="code">f n a1 .. an ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops a function label and a number <span class="code">n</span> off the work stack. It
            then pops <span class="code">n</span> items off the work stack, creates a new frame
            containing them, and pushes it onto the work stack. It then pushes a new item containing
            the function label onto the call stack, effectively calling the function with arguments
            <span class="code">a1 .. an</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">ret</span></td>
          <td><span class="code">..</span></td>
          <td><span class="code">..</span></td>
          <td>Pops one frame off the frame stack, and pops one item off the call stack.</td>
        </tr>
        <tr>
          <td><span class="code">halt</span></td>
          <td><span class="code">..</span></td>
          <td><span class="code">..</span></td>
          <td>Halts the ParL VM.</td>
        </tr>
        <tr>
          <td><span class="code">alloc</span></td>
          <td><span class="code">a ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops the number <span class="code">a</span> off the work stack and allocates
            <span class="code">a</span> new empty locations at the end of the frame at the top of
            the frame stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">oframe</span></td>
          <td><span class="code">a ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops the number <span class="code">a</span> off the work stack and creates a new frame
            with <span class="code">a</span> empty locations, pushing it onto the frame stack.
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
          <td><span class="code">f l v ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops two numbers and an item off the work stack, and stores the item
            <span class="code">v</span> at the <span class="code">l</span>th location of the
            <span class="code">f</span>th frame in the frame stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">delay</span></td>
          <td><span class="code">a ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops a number <span class="code">a</span> off the work stack and sleeps for
            <span class="code">a</span> milliseconds.
          </td>
        </tr>
        <tr>
          <td><span class="code">write</span></td>
          <td><span class="code">x y c ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops two numbers <span class="code">x, y</span> and a colour
            <span class="code">c</span> off the work stack and colours the pixel on the screen at
            <span class="code">x, y</span> with colour <span class="code">c</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">writebox</span></td>
          <td><span class="code">x y w h c ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops four numbers <span class="code">x, y, w, h</span> and a colour
            <span class="code">c</span> off the work stack and colours a rectangle on the screen of
            width <span class="code">w</span> and height <span class="code">h</span> whose bottom left
            corner is at <span class="code">x, y</span> with colour <span class="code">c</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">clear</span></td>
          <td><span class="code">c ..</span></td>
          <td><span class="code">..</span></td>
          <td>Pops a colour off the work stack and colours the entire screen with it.</td>
        </tr>
        <tr>
          <td><span class="code">read</span></td>
          <td><span class="code">x y ..</span></td>
          <td><span class="code">c ..</span></td>
          <td>
            Pops two numbers <span class="code">x, y</span> off the work stack, and pushes the
            colour of the pixel at <span class="code">x, y</span> on the screen onto the work stack.
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
          <td><span class="code">alloca</span></td>
          <td><span class="code">a ..</span></td>
          <td><span class="code">b ..</span></td>
          <td>
            Pops a number <span class="code">a</span> off the work stack, creates a new array
            containing <span class="code">a</span> empty locations, and pushes a pointer to it onto
            the work stack.
          </td>
        </tr>
        <tr>
          <td><span class="code">sta</span></td>
          <td><span class="code">a i v ..</span></td>
          <td><span class="code">..</span></td>
          <td>
            Pops a pointer to an array <span class="code">a</span>, a number
            <span class="code">i</span> and an item <span class="code">v</span> off the work stack,
            and sets the <span class="code">i</span>th location in array
            <span class="code">a</span> to value <span class="code">v</span>.
          </td>
        </tr>
        <tr>
          <td><span class="code">lda</span></td>
          <td><span class="code">a i ..</span></td>
          <td><span class="code">a[i] ..</span></td>
          <td>
            Pops a pointer to an array <span class="code">a</span> and a number
            <span class="code">i</span> off the work stack, then pushes the item at the
            <span class="code">i</span>th location in array <span class="code">a</span> onto the
            work stack.
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
            Pops floating point number <span class="code">c</span>, rounds it to the nearest 
            integer, and prints the character with that Unicode code point to the output log.
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
