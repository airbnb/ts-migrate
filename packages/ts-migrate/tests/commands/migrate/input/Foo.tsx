/* eslint-disable @typescript-eslint/ban-types, react/jsx-no-undef */
import React from 'react';

type Props = {};

function Foo(props: Props) {
  return (
    <div>
      <DoesNotExist />
    </div>
  );
}

export default Foo;
