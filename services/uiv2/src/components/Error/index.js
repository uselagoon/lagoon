import { Segment } from 'semantic-ui-react';

const Error = ({ ...error }) => {
  return (
    <div>
       <Segment inverted color='red' secondary>{`Error! ${error.message}`}</Segment>
    </div>
  )
};

export default Error;