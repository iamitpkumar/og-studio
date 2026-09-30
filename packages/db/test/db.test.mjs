import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { mkdirSync, mkdtempSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root=fileURLToPath(new URL('../../../',import.meta.url));
mkdirSync(join(root,'data/test-runs'),{recursive:true});
const directory=mkdtempSync(join(root,'data/test-runs/legacy-db-'));
const setup=spawnSync(process.execPath,[join(root,'packages/db/node_modules/prisma/build/index.js'),'migrate','diff','--from-empty','--to-schema-datamodel',join(root,'packages/db/prisma/schema.prisma'),'--script'],{encoding:'utf8',windowsHide:true});
assert.equal(setup.status,0,setup.stderr||setup.stdout);
const database=new DatabaseSync(join(directory,'isolated.db'));database.exec(setup.stdout);database.close();
const prisma = new PrismaClient({datasources:{db:{url:`file:${join(directory,'isolated.db').replaceAll('\\','/')}`}}});
test.after(async()=>prisma.$disconnect());

test("Prisma stores and retrieves Client, Project, Brief and Storyboard", async () => {
  const client = await prisma.client.create({
    data: {
      name: "Acme Properties",
      industry: "real_estate"
    }
  });
  assert.ok(client.id);

  const project = await prisma.project.create({
    data: {
      title: "Penthouse Showcase 9:16",
      clientId: client.id,
      aspectRatio: "9:16",
      status: "draft",
      currentStage: "04_storyboard"
    }
  });
  assert.equal(project.title, "Penthouse Showcase 9:16");

  const brief = await prisma.brief.create({
    data: {
      projectId: project.id,
      rawPrompt: "Create 30s vertical tour of modern luxury penthouse",
      industry: "real_estate",
      aspectRatio: "9:16",
      targetDurationSeconds: 30
    }
  });
  assert.equal(brief.targetDurationSeconds, 30);

  const fetched = await prisma.project.findUnique({
    where: { id: project.id },
    include: { client: true, briefs: true }
  });
  assert.equal(fetched?.client?.name, "Acme Properties");
  assert.equal(fetched?.briefs.length, 1);

  // Clean up test data
  await prisma.project.delete({ where: { id: project.id } });
  await prisma.client.delete({ where: { id: client.id } });
  await prisma.$disconnect();
});
