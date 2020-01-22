/* eslint-disable react/jsx-no-undef */
import React from 'react';

type Props = {};

function Foo(props: Props) {
  return (
    <div>
      {/*
// @ts-ignore ts-migrate(2304) FIXME: Cannot find name 'DoesNotExist'. */}
      <DoesNotExist />
    </div>
  );
}

export default Foo;
