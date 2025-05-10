/* eslint-disable react/jsx-no-undef */
import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type Props = {};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Foo(props: Props) {
  return (
    <div>
      {/* @ts-expect-error TS(2304) FIXME: Cannot find name 'DoesNotExist'. */}
      <DoesNotExist />
    </div>
  );
}

export default Foo;
