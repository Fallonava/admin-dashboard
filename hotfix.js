const fs = require('fs');

function fixDoctorCard(path) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(
    /          <\/div>\s*<\/div>, document\.body/,
    `          </div>
        </div>
      </div>, document.body`
  );
  fs.writeFileSync(path, code);
}

function fixWeeklyView(path) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(
    /                    <\/div>\s*<\/div>, document\.body\) : null\}/,
    `                    </div>
                  </div>
                </div>, document.body) : null}`
  );
  fs.writeFileSync(path, code);
}

fixDoctorCard('/home/fallonava/simed/src/app/jadwal/components/DoctorCard.tsx');
fixWeeklyView('/home/fallonava/simed/src/app/jadwal/components/WeeklyView.tsx');
