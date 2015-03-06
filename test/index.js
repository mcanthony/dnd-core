'use strict';

import expect from 'expect.js';
import Types from './Types';
import { NormalSource, NonDraggableSource } from './DragSources';
import { NormalTarget, NonDroppableTarget, TargetWithNoDropResult } from './DropTargets';
import { DragDropManager, TestBackend } from '../modules';

describe('DragDropContext', () => {
  let manager;
  let backend;
  let context;

  beforeEach(() => {
    manager = new DragDropManager(TestBackend);

    context = manager.getContext();
    backend = manager.getBackend();
  });

  it('raises change events on beginDrag()', (done) => {
    const source = new NormalSource();
    const sourceHandle = manager.addSource(Types.FOO, source);

    context.addChangeListener(() => {
      expect(context.isDragging()).to.equal(true);
      done();
    });
    backend.simulateBeginDrag(sourceHandle);
  });

  it('raises change events on endDrag()', (done) => {
    const source = new NormalSource();
    const sourceHandle = manager.addSource(Types.FOO, source);
    const target = new NormalTarget();
    manager.addTarget(Types.FOO, target);

    backend.simulateBeginDrag(sourceHandle);
    expect(context.isDragging()).to.equal(true);

    context.addChangeListener(() => {
      expect(context.isDragging()).to.equal(false);
      done();
    });
    backend.simulateEndDrag();
  });
});

describe('DragDropManager', () => {
  let manager;
  let backend;
  let context;

  beforeEach(() => {
    manager = new DragDropManager(TestBackend);

    context = manager.getContext();
    backend = manager.getBackend();
  });

  it('prevents drag if canDrag() returns false', () => {
    const source = new NonDraggableSource();
    const sourceHandle = manager.addSource(Types.FOO, source);

    backend.simulateBeginDrag(sourceHandle);
    expect(context.isDragging()).to.equal(false);
    expect(context.didDrop()).to.equal(false);
  });

  it('begins drag if canDrag() returns true', () => {
    const source = new NormalSource();
    const sourceHandle = manager.addSource(Types.FOO, source);

    backend.simulateBeginDrag(sourceHandle);
    expect(context.isDragging()).to.equal(true);
    expect(context.didDrop()).to.equal(false);
  });

  it('throws if beginDrag() is called twice during one operation', () => {
    const source = new NormalSource();
    const sourceHandle = manager.addSource(Types.FOO, source);

    backend.simulateBeginDrag(sourceHandle);
    expect(() => backend.simulateBeginDrag(sourceHandle)).to.throwError();
  });

  it('lets beginDrag() be called again in a next operation', () => {
    const source = new NormalSource();
    const sourceHandle = manager.addSource(Types.FOO, source);

    backend.simulateBeginDrag(sourceHandle);
    backend.simulateEndDrag(sourceHandle);
    expect(() => backend.simulateBeginDrag(sourceHandle)).to.not.throwError();
  });

  it('passes drop() return value to endDrag() if dropped on a target', () => {
    const source = new NormalSource();
    const sourceHandle = manager.addSource(Types.FOO, source);
    const target = new NormalTarget();
    const targetHandle = manager.addTarget(Types.FOO, target);

    backend.simulateBeginDrag(sourceHandle);
    backend.simulateDrop(targetHandle);
    backend.simulateEndDrag();
    expect(context.isDragging()).to.equal(false);
    expect(context.didDrop()).to.equal(false);
    expect(source.endDragArgument.foo).to.equal('bar');
  });

  it('passes true to endDrag() by default if dropped on a target', () => {
    const source = new NormalSource();
    const sourceHandle = manager.addSource(Types.FOO, source);
    const target = new TargetWithNoDropResult();
    const targetHandle = manager.addTarget(Types.FOO, target);

    backend.simulateBeginDrag(sourceHandle);
    backend.simulateDrop(targetHandle);
    expect(context.didDrop()).to.equal(true);

    backend.simulateEndDrag();
    expect(context.isDragging()).to.equal(false);
    expect(context.didDrop()).to.equal(false);
    expect(source.endDragArgument).to.equal(true);
  });

  it('passes false to endDrag() if dropped outside a target', () => {
    const source = new NormalSource();
    const sourceHandle = manager.addSource(Types.FOO, source);

    backend.simulateBeginDrag(sourceHandle);
    backend.simulateEndDrag();
    expect(context.isDragging()).to.equal(false);
    expect(source.endDragArgument).to.equal(false);
  });

  it('prevents drop if canDrop() returns false', () => {
    const source = new NormalSource();
    const sourceHandle = manager.addSource(Types.FOO, source);
    const target = new NonDroppableTarget();
    const targetHandle = manager.addTarget(Types.FOO, target);

    backend.simulateBeginDrag(sourceHandle);
    backend.simulateDrop(targetHandle);
    expect(context.didDrop()).to.equal(false);

    backend.simulateEndDrag();
    expect(context.isDragging()).to.equal(false);
    expect(context.didDrop()).to.equal(false);
    expect(source.endDragArgument).to.equal(false);
  });
});
