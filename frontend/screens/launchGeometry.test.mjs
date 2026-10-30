import test from 'node:test';
import assert from 'node:assert/strict';
import { getLaunchGeometry } from './launchGeometry.mjs';

for (const [width, height, top, bottom] of [[320,568,20,0],[375,667,20,0],[390,844,59,34],[430,932,59,34],[844,390,0,21],[1024,768,24,20]]) {
  test(`intro artwork stays below title and inside ${width}x${height}`, () => {
    const g = getLaunchGeometry(width, height, { top, bottom });
    assert.ok(g.groundY - 340 * g.cloudScale >= g.stageTop - 0.01);
    assert.ok(320 * g.cloudScale <= width - 40 + 0.01);
    assert.ok(g.groundY < height - bottom);
    assert.ok(g.endX > g.startX && g.endY > g.startY);
    assert.ok(g.rotation > 45 && g.rotation < 135);
    const largerTitle = getLaunchGeometry(width,height,{top,bottom},g.stageTop + 20);
    assert.ok(largerTitle.groundY - 340 * largerTitle.cloudScale >= largerTitle.stageTop - 0.01);
  });
}
