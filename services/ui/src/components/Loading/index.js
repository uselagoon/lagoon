import React, { useState, useEffect, useRef } from 'react';
import { Grid, Item, Dimmer, Loader, Placeholder, Segment } from 'semantic-ui-react';

export const LoadingContent = () => (
  <Grid columns={3} stackable>
    <Grid.Column>
      <Segment raised>
        <Placeholder>
          <Placeholder.Header>
              <Placeholder.Line />
              <Placeholder.Line />
          </Placeholder.Header>
          <Placeholder.Paragraph>
              <Placeholder.Line />
              <Placeholder.Line />
          </Placeholder.Paragraph>
        </Placeholder>
      </Segment>
    </Grid.Column>

    <Grid.Column>
      <Segment raised>
        <Placeholder>
          <Placeholder.Header>
              <Placeholder.Line />
              <Placeholder.Line />
          </Placeholder.Header>
          <Placeholder.Paragraph>
              <Placeholder.Line />
              <Placeholder.Line />
          </Placeholder.Paragraph>
        </Placeholder>
      </Segment>
    </Grid.Column>

    <Grid.Column>
      <Segment raised>
        <Placeholder>
          <Placeholder.Header>
              <Placeholder.Line />
              <Placeholder.Line />
          </Placeholder.Header>
          <Placeholder.Paragraph>
              <Placeholder.Line />
              <Placeholder.Line />
          </Placeholder.Paragraph>
        </Placeholder>
      </Segment>
    </Grid.Column>
  </Grid>
);

export const LoadingRowsContent = (numRows) => {
  let { rows } = numRows || 25;
  let items = [];

  for (let i = 0; i < rows; i++) {
    items.push(
        <Item key={`item-${i}`}>
            <Item.Content verticalAlign='middle'>
                <Segment>
                    <Placeholder>
                    <Placeholder.Header>
                        <Placeholder.Line />
                        <Placeholder.Line />
                    </Placeholder.Header>
                    <Placeholder.Paragraph>
                        <Placeholder.Line />
                        <Placeholder.Line />
                    </Placeholder.Paragraph>
                    </Placeholder>
                </Segment>
            </Item.Content>
        </Item>
    )
  }

  return <Item.Group divided>{items}</Item.Group>
};

export const LoadingRowsWithSpinner = (numRows) => {
  let { rows } = numRows || 25;
  return(
    <Item.Group divided>
      <Dimmer active inverted>
        <Loader inverted>Loading</Loader>
      </Dimmer>
      <LoadingRowsContent rows={rows} />
    </Item.Group>
  )
};

export const LoadingSpinner = () => {
    return(
     <Loader size='tiny' active inline='centered' />
  )
}


//TODO: This can be replaced with React's useTransition method when concurrent mode is out of experimental.
export const LazyLoadingContent = ({
    delay = 250,
    ...props
}) => {
  const containerRef = useRef();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timeout = setTimeout(() => setShow(true), 300)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  return !show ? <div ref={containerRef} className="fallback-fadein"><LoadingRowsContent {...props} /></div> : null;
}

export default LoadingContent;