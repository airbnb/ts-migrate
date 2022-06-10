/* eslint-disable @typescript-eslint/ban-types, react/jsx-no-undef */
import React from 'react';

type Props = {};

function Foo(props: Props) {
  return (
    <div>
      {/* @ts-expect-error TS(2304) FIXME: Cannot find name 'DoesNotExist'. */}
      <DoesNotExist />
    </div>
  );
}

export default Foo;
