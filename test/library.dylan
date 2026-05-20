Module: dylan-user

define library hello
  use dylan;
  use io, import: { format-out };
end;

define module hello
  use dylan;
  use format-out;
end;
