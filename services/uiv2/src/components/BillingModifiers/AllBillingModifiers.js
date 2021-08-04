import * as R from 'ramda';
import React, { useState }  from 'react';
import { graphql, compose, Mutation, Query } from '@apollo/client';
import { useMutation } from '@apollo/client';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { useApolloClient } from "@apollo/client";

import styled from "@emotion/styled";
import css from 'styled-jsx/css';
import Button from '../Button';

import UpdateBillingModifierMutation from 'lib/mutation/UpdateBillingModifier';
import DeleteBillingModifierMutation from 'lib/mutation/DeleteBillingModifier';
import AllBillingModifiersQuery from 'lib/query/AllBillingModifiers';
import BillingGroupCostsQuery from 'lib/query/BillingGroupCosts';

import withQueryLoading from 'lib/withQueryLoading';
import withQueryError from 'lib/withQueryError';

import { bp, color, fontSize } from 'lib/variables';
import { json } from 'body-parser';

const grid = 8;

const ModifierItem = styled.div`
  width: 100%;
  border: 1px solid grey;
  margin-bottom: ${grid}px;
  padding: ${grid}px;
`;

const Modifier = ({modifier, index, editHandler}) => {
  const { id, group, name, startDate, endDate, customerComments, adminComments, weight, discountFixed, discountPercentage, extraFixed, extraPercentage, min, max } = modifier;

  const [deleteModifier, {
    loading: mutationLoading,
    error: mutationError
  }] = useMutation(DeleteBillingModifierMutation,
    {
      update(cache, { data: { deleteBillingModifier } }){
        if (deleteBillingModifier === 'success'){
          const variables = { input: { name: group.name } };
          const { allBillingModifiers } = cache.readQuery({ query: AllBillingModifiersQuery, variables});
          const data = { allBillingModifiers: allBillingModifiers.filter(modifier => modifier.id !== id) };
          cache.writeQuery({ query: AllBillingModifiersQuery, variables, data });
        }
      }
    }
  );

  const deletehandler = () => deleteModifier({ variables: { input: { id } } })
  return(
    <Draggable draggableId={`${id}-${name}`} index={index}>
      {provided => (
        <ModifierItem
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          {mutationLoading && <p>Deleting...</p>}
          {mutationError && <p>Error :( Please try again</p>}

          <div className="modifier-item">
            <div className="modifier-value">
              {discountFixed !== 0 ? `- ${discountFixed}` : ''}
              {discountPercentage !== 0 ? `- ${discountPercentage}%` : ''}
              {extraFixed !== 0 ? `+ ${extraFixed}` : ''}
              {extraPercentage !== 0 ? `+ ${extraPercentage}%` : ''}
              {min !== 0 ? `Minimum: ${min.toFixed(2)}` : ''}
              {max !== 0 ? `Maximum: ${max.toFixed(2)}` : ''}
            </div>
            <div className="modifier-range">
              {startDate.replace('00:00:00', '')} - {endDate.replace('00:00:00', '')}<br/>
            </div>
            <div className="comments">
              <div>Customer Comments: {customerComments}</div>
              <div>Admin Comments: {adminComments}</div>
            </div>
            <div className="edit-delete-container">
              <div className="edit">
                <Button action={()=>{editHandler(modifier)}}>Edit</Button>
              </div>
              <div className="delete">
                <Button action={deletehandler} variant='red' >Delete</Button>
              </div>
            </div>
          </div>


          <style jsx>{`

          .edit-delete-container {
            position: absolute;
            top: 15px;
            right: 15px;
            display:flex;

            div::after {
              content: '';
              padding: 0.5em;
            }
          }

          .modifier-item {
            position: relative;
          }

          .modifier-value {
            font-weight: bold;
          }
          .comments {
            padding-top: 15px;
            margin-right: 100px;
          }
          .delete {

          }

          `}</style>

        </ModifierItem>
      )}

    </Draggable>
  );
}

const ModifierList = React.memo(function ModifierList({ modifiers, editHandler }) {
  return modifiers.map((modifier, index) => (<Modifier modifier={modifier} index={index} key={modifier.id} editHandler={editHandler} />));
});


const reorder = (list, startIndex, endIndex) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result.map((item, index) => ({...item, weight: index}));
};

const AllBillingModifiers = ({group, modifiers, month, editHandler}) => {

  const client = useApolloClient();

  const [updateModifier] = useMutation(
    UpdateBillingModifierMutation,
    {
      update(cache, { data: { updateBillingModifier } }){
        const variables = { input: { name: group } };
        const { allBillingModifiers } = cache.readQuery({ query: AllBillingModifiersQuery, variables});
        const { id, weight } = updateBillingModifier;

        const idx = allBillingModifiers.findIndex(({id}) => id === id );

        if(allBillingModifiers[idx].weight !== weight){
          const data = { allBillingModifiers: allBillingModifiers.map(obj => id === obj.id ? updateBillingModifier : obj) };
          cache.writeQuery({ query: AllBillingModifiersQuery, variables, data });
        }

      }
    }
  );


  const onDragEnd = (result) => {

    editHandler({});

    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) {
      return;
    }

    const reorderedModifiers = reorder(
      modifiers,
      result.source.index,
      result.destination.index
    );


    reorderedModifiers.forEach(modifier => {
      const {id, weight} = modifier;

      const optimisticResponse = {
        updateBillingModifier: {
          ...modifier,
          __typename: "BillingModifier",
          group: {
            ...modifier.group,
            type: "billing",
            __typename: "BillingGroup"
          }
        }
      };

      const variables = { input: { id, patch: { weight }} };

      updateModifier({variables, optimisticResponse });
    });


    const variables = { input: { name: group } };
    const data = { allBillingModifiers: reorderedModifiers };
    client.writeQuery({ query: AllBillingModifiersQuery, variables, data });

  } // end onDragEnd

  return(
    <div className="modifiers">

      <h2>Billing Modifiers</h2>

      {!modifiers.length && (
        <div className="data-none">No Billing Modifiers</div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="droppable">
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                <ModifierList modifiers={modifiers} editHandler={editHandler} />
                {provided.placeholder}
              </div>
            )}
        </Droppable>
      </DragDropContext>


    <style jsx>{`

      .header {
        @media ${bp.wideUp} {
          align-items: center;
          display: flex;
          margin: 0 0 14px;
          padding-right: 40px;
        }
        @media ${bp.smallOnly} {
          flex-wrap: wrap;
        }
        @media ${bp.tabletUp} {
          margin-top: 40px;
        }
      }

    `}</style>
  </div>
  );

}

export default AllBillingModifiers;
