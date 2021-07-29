import { Card, Icon, Header, Button } from 'semantic-ui-react';

const CardContent = ({ header, linkText, link, children }) => (
  <Card fluid>
    <Card.Content>
      <Header textAlign='left' size='small' floated='left'>{header}</Header>
      {link && <Button floated='right'>{linkText}</Button>}
    </Card.Content>
    <Card.Content>
      {children}
    </Card.Content>
  </Card>
);

export default CardContent;